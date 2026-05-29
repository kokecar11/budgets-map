import Foundation

/// Decoded response from `POST /api/v1/auth/signin` and `POST /api/v1/auth/refresh`.
struct TokenResponse: Decodable, Sendable {
    let accessToken: String
    let refreshToken: String
    let tokenType: String
    let expiresIn: Int
    let userId: String
    let email: String
    let name: String
    let currency: String
    let plan: String
    let requiresConfirmation: Bool

    enum CodingKeys: String, CodingKey {
        case accessToken          = "access_token"
        case refreshToken         = "refresh_token"
        case tokenType            = "token_type"
        case expiresIn            = "expires_in"
        case userId               = "user_id"
        case email
        case name
        case currency
        case plan
        case requiresConfirmation = "requires_confirmation"
    }
}
