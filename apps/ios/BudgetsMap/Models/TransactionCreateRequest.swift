import Foundation

/// Request body for POST /api/v1/transactions.
///
/// Nil optionals are OMITTED from the encoded JSON (not sent as null) via
/// synthesized `Encodable` which calls `encodeIfPresent` for Optional fields.
/// `user_id` is deliberately absent — the backend derives it from the Bearer token.
struct TransactionCreateRequest: Encodable, Sendable {
    let type: TransactionType
    let amount: Decimal
    let date: Date
    let accountId: String?
    let categoryId: String?
    let description: String?

    enum CodingKeys: String, CodingKey {
        case type
        case amount
        case date
        case accountId   = "account_id"
        case categoryId  = "category_id"
        case description
    }
}
