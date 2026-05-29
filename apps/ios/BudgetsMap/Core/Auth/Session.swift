import Foundation

/// Authenticated session value type — persisted to Keychain as JSON.
/// Property names are the storage format; no CodingKeys override needed.
struct Session: Codable, Sendable {
    var accessToken: String
    var refreshToken: String
    /// Computed at store time: `Date() + Double(tokenResponse.expiresIn)`
    var expiresAt: Date
    let userId: String
    let email: String
    let name: String
    /// ISO 4217 currency code, e.g. "COP", "USD"
    let currency: String
    let plan: String
}
