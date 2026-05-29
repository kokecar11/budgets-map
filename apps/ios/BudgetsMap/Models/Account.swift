import Foundation

/// Account type — strict decoding for MVP.
enum AccountType: String, Codable, Sendable {
    case bank
    case cash
    case digitalWallet = "digital_wallet"
}

/// A user's financial account.
/// `balance` is `Decimal` for correct monetary arithmetic.
struct Account: Decodable, Identifiable, Sendable {
    let id: String
    let userId: String
    let name: String
    let type: AccountType
    let balance: Decimal
    let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case userId   = "user_id"
        case name
        case type
        case balance
        case isActive = "is_active"
    }
}
