import Foundation

/// Stateless service that wraps the three auth endpoints.
/// Holds no state — inject once and reuse.
final class AuthService: Sendable {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    // MARK: - Sign in

    func signIn(email: String, password: String) async throws -> TokenResponse {
        try await apiClient.request(Endpoint.signin(email: email, password: password))
    }

    // MARK: - Refresh

    func refresh(refreshToken: String) async throws -> TokenResponse {
        try await apiClient.request(Endpoint.refresh(refreshToken: refreshToken))
    }

    // MARK: - Sign out (best-effort — callers use `try?`)

    func signOut(refreshToken: String) async throws {
        try await apiClient.send(Endpoint.signout(refreshToken: refreshToken))
    }
}
