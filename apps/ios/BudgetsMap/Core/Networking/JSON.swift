import Foundation

/// Shared JSON codec configuration used across all API decoding / encoding.
/// - Decoder: ISO8601 dates with fractional-seconds fallback; no key strategy override (explicit CodingKeys on models).
/// - Encoder: ISO8601 dates.
enum JSONCoding {
    // MARK: - Decoder

    static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let raw = try container.decode(String.self)

            // Try fractional-seconds first (most common from modern APIs).
            if let date = fractionalSecondsFormatter.date(from: raw) {
                return date
            }
            // Fallback to plain ISO8601 (no fractional seconds).
            if let date = plainFormatter.date(from: raw) {
                return date
            }
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date from '\(raw)'. Expected ISO8601 string."
            )
        }
        return d
    }()

    // MARK: - Encoder

    static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    // MARK: - Private formatters
    // `nonisolated(unsafe)` is correct here: formatters are initialized once and never mutated.
    // ISO8601DateFormatter is a class that is not declared Sendable by the SDK, but read-only
    // access across concurrent contexts is safe for formatters configured at init time.

    private nonisolated(unsafe) static let fractionalSecondsFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private nonisolated(unsafe) static let plainFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()
}
