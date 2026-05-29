import Foundation
import Observation

/// Authenticated session state — source of truth for the entire app's auth routing.
@MainActor
@Observable
final class SessionStore {
    // MARK: - State machine

    enum SessionState: Sendable {
        case bootstrapping
        case unauthenticated
        case authenticated(Session)
    }

    // MARK: - Observable state

    private(set) var state: SessionState = .bootstrapping

    // MARK: - Dependencies

    private let authService: AuthService
    private let tokenRefresher: TokenRefresher
    private let persistence: SessionPersistence

    /// Proactive-refresh safety margin: refresh if token expires within 60 seconds.
    private let safetyMarginSeconds: TimeInterval = 60

    init(
        authService: AuthService,
        tokenRefresher: TokenRefresher,
        persistence: SessionPersistence
    ) {
        self.authService = authService
        self.tokenRefresher = tokenRefresher
        self.persistence = persistence
    }

    // MARK: - Lifecycle

    /// Called once at app launch. Reads Keychain and sets the initial routing state.
    func bootstrap() async {
        state = .bootstrapping

        guard let stored = persistence.load() else {
            state = .unauthenticated
            return
        }

        if Date() < stored.expiresAt - safetyMarginSeconds {
            // Token is still valid.
            state = .authenticated(stored)
            return
        }

        // Token is within safety margin or expired — attempt one refresh.
        do {
            let refreshed = try await tokenRefresher.refresh(using: stored.refreshToken)
            try? persistence.save(refreshed)
            state = .authenticated(refreshed)
        } catch {
            persistence.clear()
            state = .unauthenticated
        }
    }

    // MARK: - Sign in

    func signIn(email: String, password: String) async throws {
        let tokenResponse = try await authService.signIn(email: email, password: password)
        let session = Session(
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt: Date().addingTimeInterval(Double(tokenResponse.expiresIn)),
            userId: tokenResponse.userId,
            email: tokenResponse.email,
            name: tokenResponse.name,
            currency: tokenResponse.currency,
            plan: tokenResponse.plan
        )
        try persistence.save(session)
        state = .authenticated(session)
    }

    // MARK: - Sign out

    func signOut() async {
        if case .authenticated(let session) = state {
            try? await authService.signOut(refreshToken: session.refreshToken)
        }
        persistence.clear()
        await tokenRefresher.reset()
        state = .unauthenticated
    }

    // MARK: - Convenience

    /// The current authenticated session, or `nil` if not authenticated.
    var currentSession: Session? {
        if case .authenticated(let s) = state { return s }
        return nil
    }
}

// MARK: - TokenProviding conformance

extension SessionStore: TokenProviding {
    /// Returns a valid access token, proactively refreshing if within the 60s safety margin.
    nonisolated func validAccessToken() async throws -> String {
        // Hop to MainActor to read state safely.
        let session = await MainActor.run { self.currentSession }
        guard let session else { throw APIError.missingToken }

        if Date() < session.expiresAt - safetyMarginSeconds {
            return session.accessToken
        }

        // Proactive refresh.
        let refreshed = try await tokenRefresher.refresh(using: session.refreshToken)
        await MainActor.run {
            try? self.persistence.save(refreshed)
            self.state = .authenticated(refreshed)
        }
        return refreshed.accessToken
    }

    /// Forces a refresh unconditionally (reactive path — called by APIClient on 401).
    nonisolated func forceRefresh() async throws {
        let session = await MainActor.run { self.currentSession }
        guard let session else { throw APIError.missingToken }

        let refreshed = try await tokenRefresher.refresh(using: session.refreshToken)
        await MainActor.run {
            try? self.persistence.save(refreshed)
            self.state = .authenticated(refreshed)
        }
    }
}
