import Foundation

/// Category type — income or expense only (no savings/transfer at category level).
enum CategoryType: String, Codable, Sendable {
    case income
    case expense
}

/// A spending or income category.
struct Category: Decodable, Identifiable, Sendable {
    let id: String
    let userId: String
    let name: String
    let type: CategoryType
    let icon: String?
    let color: String?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case type
        case icon
        case color
    }
}
