import Foundation

/// Transaction type enum — strict decoding for MVP (5 fixed cases).
enum TransactionType: String, Codable, Sendable {
    case income
    case expense
    case transfer
    case saving
    case creditCardCharge = "credit_card_charge"
}

/// A single financial transaction.
/// `amount` is `Decimal` (not `Double`) to avoid floating-point rounding in currency sums.
struct Transaction: Decodable, Identifiable, Sendable {
    let id: String
    let userId: String
    let accountId: String?
    let type: TransactionType
    let amount: Decimal
    let date: Date
    let categoryId: String?
    let description: String?
    let isRecurring: Bool
    let savingGoalId: String?

    enum CodingKeys: String, CodingKey {
        case id
        case userId        = "user_id"
        case accountId     = "account_id"
        case type
        case amount
        case date
        case categoryId    = "category_id"
        case description
        case isRecurring   = "is_recurring"
        case savingGoalId  = "saving_goal_id"
    }
}
