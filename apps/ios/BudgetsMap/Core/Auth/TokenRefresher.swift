import Foundation

/// Actor that guarantees a single in-flight refresh `Task` at a time.
/// N concurrent callers that hit an expired token all await the same `Task` — one network call only.
actor TokenRefresher {
    private let authService: AuthService
    private var inFlight: Task<Session, Error>?

    init(authService: AuthService) {
        self.authService = authService
    }

    // MARK: - Public

    /// Refreshes the session using `refreshToken`.
    /// Concurrent calls during an in-flight refresh JOIN the existing task instead of starting new ones.
    func refresh(using refreshToken: String) async throws -> Session {
        if let existing = inFlight {
            // Join the existing in-flight task — single-flight guarantee.
            return try await existing.value
        }

        let task = Task<Session, Error> {
            try await self.performRefresh(refreshToken)
        }
        inFlight = task
        defer { inFlight = nil }
        return try await task.value
    }

    /// Cancels any in-flight refresh task and clears the reference.
    /// Called on sign-out to clean up state.
    func reset() {
        inFlight?.cancel()
        inFlight = nil
    }

    // MARK: - Private

    private func performRefresh(_ refreshToken: String) async throws -> Session {
        let tokenResponse = try await authService.refresh(refreshToken: refreshToken)
        return Session(
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt: Date().addingTimeInterval(Double(tokenResponse.expiresIn)),
            userId: tokenResponse.userId,
            email: tokenResponse.email,
            name: tokenResponse.name,
            currency: tokenResponse.currency,
            plan: tokenResponse.plan
        )
    }
}
