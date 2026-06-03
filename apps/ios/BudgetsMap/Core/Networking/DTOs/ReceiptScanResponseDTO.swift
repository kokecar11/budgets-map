import Foundation

/// Decodable DTO that mirrors the backend `ReceiptScanResponse` JSON.
///
/// Backend sends snake_case keys (`category_id`); explicit `CodingKeys` handle the mapping.
/// `toResult()` converts the raw JSON types to the app's domain types:
///   - `Double?` → `Decimal?`
///   - ISO "yyyy-MM-dd" string → `Date?` (lenient; nil on failure)
///   - `String?` → `TransactionType?` (fallback `.expense`)
struct ReceiptScanResponseDTO: Decodable, Sendable {
    let amount: Double?
    let date: String?
    let merchant: String?
    let type: String?
    let categoryId: String?
    let currency: String?

    enum CodingKeys: String, CodingKey {
        case amount
        case date
        case merchant
        case type
        case categoryId = "category_id"
        case currency
    }

    // MARK: - Domain mapping

    /// Converts this DTO into an app-domain `ReceiptScanResult`.
    func toResult() -> ReceiptScanResult {
        // Double → Decimal (via string round-trip to avoid floating-point rounding).
        let decimalAmount: Decimal? = amount.map { Decimal(string: "\($0)") ?? Decimal($0) }

        // "yyyy-MM-dd" string → Date (lenient).
        let parsedDate: Date? = date.flatMap { Self.dateFromString($0) }

        // String → TransactionType (fallback .expense; only income/expense are valid from LLM).
        let txType: TransactionType? = type.flatMap {
            guard let raw = TransactionType(rawValue: $0),
                  raw == .income || raw == .expense else { return .expense }
            return raw
        }

        return ReceiptScanResult(
            amount: decimalAmount,
            date: parsedDate,
            merchant: merchant,
            currency: currency,
            categoryId: categoryId,
            type: txType
        )
    }

    // MARK: - Private helpers

    /// Parses an ISO "yyyy-MM-dd" date string, with ISO8601 full-datetime as fallback.
    private static func dateFromString(_ raw: String) -> Date? {
        if let d = plainDateFormatter.date(from: raw) { return d }
        // Fallback: some backends return full ISO8601 for date fields.
        if let d = iso8601Formatter.date(from: raw) { return d }
        return nil
    }

    // `nonisolated(unsafe)` is safe here: these formatters are initialised once and never mutated.
    private nonisolated(unsafe) static let plainDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        return f
    }()

    private nonisolated(unsafe) static let iso8601Formatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
