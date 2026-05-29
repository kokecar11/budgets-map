import SwiftUI

/// Application entry point.
/// Constructs the full object graph in `init()` and injects `SessionStore` into the environment.
@main
struct BudgetsMapApp: App {

    // MARK: - Object graph (all assembled in init)

    private let apiClient: APIClient
    private let sessionStore: SessionStore

    init() {
        // Step 1 — Storage
        let keychainStore = KeychainStore()
        let sessionPersistence = SessionPersistence(store: keychainStore)

        // Step 2 — Break the APIClient ↔ SessionStore initialization cycle.
        // APIClient needs a TokenProviding at init, but SessionStore isn't created yet.
        // TokenProviderBox is a mutable reference-wrapper filled after SessionStore exists.
        let tokenProviderBox = TokenProviderBox()

        let apiClient = APIClient(
            baseURL: AppConfig.shared.baseURL,
            tokenProvider: tokenProviderBox
        )

        // Step 3 — Auth layer
        let authService = AuthService(apiClient: apiClient)
        let tokenRefresher = TokenRefresher(authService: authService)

        // Step 4 — Session store
        let sessionStore = SessionStore(
            authService: authService,
            tokenRefresher: tokenRefresher,
            persistence: sessionPersistence
        )

        // Step 5 — Close the cycle: box now delegates to the real SessionStore.
        tokenProviderBox.wrapped = sessionStore

        self.apiClient = apiClient
        self.sessionStore = sessionStore
    }

    // MARK: - Scene

    var body: some Scene {
        WindowGroup {
            RootView(apiClient: apiClient, sessionStore: sessionStore)
                .task {
                    await sessionStore.bootstrap()
                }
        }
    }
}

// MARK: - TokenProviderBox

/// Breaks the init-time cycle between `APIClient` and `SessionStore`.
/// Created before `SessionStore`; `wrapped` is set once the store exists.
/// `@unchecked Sendable` is safe here because `wrapped` is written exactly once
/// before any concurrent access begins (during the sequential `init()`).
private final class TokenProviderBox: TokenProviding, @unchecked Sendable {
    var wrapped: (any TokenProviding)?

    func validAccessToken() async throws -> String {
        guard let wrapped else { throw APIError.missingToken }
        return try await wrapped.validAccessToken()
    }

    func forceRefresh() async throws {
        guard let wrapped else { throw APIError.missingToken }
        try await wrapped.forceRefresh()
    }
}
