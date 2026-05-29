import Foundation
import Observation

/// ViewModel for the Login screen.
/// Owns email/password fields, validation, loading state, error messaging,
/// and delegates sign-in to `SessionStore`.
@MainActor
@Observable
final class LoginViewModel {

    // MARK: - Input fields

    var email: String = ""
    var password: String = ""

    // MARK: - State

    private(set) var isLoading: Bool = false
    var errorMessage: String? = nil

    // MARK: - Validation

    /// True only when both fields are non-empty and email contains "@".
    var isValid: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty &&
        !password.isEmpty &&
        email.contains("@")
    }

    // MARK: - Dependencies

    private let sessionStore: SessionStore

    init(sessionStore: SessionStore) {
        self.sessionStore = sessionStore
    }

    // MARK: - Actions

    /// Validates input and calls `SessionStore.signIn`. Sets errorMessage on failure.
    func submit() async {
        guard isValid else {
            errorMessage = "Please enter a valid email and password."
            return
        }

        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            try await sessionStore.signIn(email: email, password: password)
            // On success, SessionStore.state transitions to .authenticated —
            // RootView will automatically route to Dashboard.
        } catch APIError.unauthorized {
            errorMessage = "Invalid email or password."
        } catch APIError.network {
            errorMessage = "Could not connect. Check your connection."
        } catch {
            errorMessage = "Something went wrong. Please try again."
        }
    }
}
