import Foundation

/// Shared COP-aware money parsing and formatting helpers.
///
/// COP convention: `.` is the thousands separator, `,` is the (optional) decimal separator.
/// Examples: "1.500" → 1500, "12.345,50" → 12345.50, "500" → 500.
///
/// This is intentionally COP-biased: a lone `.` is treated as a thousands separator,
/// not a decimal point. The user reviews all prefilled values before saving.
enum MoneyParsing {

    /// Parses a user-typed string into a `Decimal`.
    /// Returns `nil` if the string cannot be interpreted as a valid positive number.
    static func decimal(from text: String, locale: Locale = .current) -> Decimal? {
        let sanitized = sanitize(text)
        guard !sanitized.isEmpty else { return nil }
        // Use POSIX locale (period as decimal separator) after sanitisation.
        return Decimal(string: sanitized, locale: Locale(identifier: "en_US_POSIX"))
    }

    /// Formats a `Decimal` back to a plain string suitable for filling the amount field.
    ///
    /// Uses a comma as the decimal separator so that the output round-trips correctly
    /// through `decimal(from:)`: `decimal(from:)` treats a lone comma as a decimal
    /// separator (COP convention), so "12345,5" → Decimal(12345.5) is correct.
    /// A lone period would be misinterpreted as a thousands separator (COP bias).
    static func string(from amount: Decimal, locale: Locale = .current) -> String {
        let nsAmount = amount as NSDecimalNumber
        // Use a NumberFormatter with comma decimal separator so the output parses
        // correctly back through decimal(from:).
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "es_CO") // comma as decimal separator
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = ""               // no thousands grouping
        formatter.decimalSeparator = ","
        formatter.maximumFractionDigits = 10           // preserve full precision
        formatter.minimumFractionDigits = 0
        return formatter.string(from: nsAmount) ?? nsAmount.stringValue
    }

    // MARK: - Internal sanitisation

    /// Strips currency symbols and normalises separators to a POSIX decimal string.
    static func sanitize(_ raw: String) -> String {
        // 1. Strip $, COP, spaces, and any non-numeric/separator characters.
        var s = raw
            .replacingOccurrences(of: "COP", with: "")
            .replacingOccurrences(of: "$", with: "")
            .replacingOccurrences(of: " ", with: "")
            .trimmingCharacters(in: .whitespaces)

        let hasDot   = s.contains(".")
        let hasComma = s.contains(",")

        if hasDot && hasComma {
            // Both present → COP convention: . = thousands, , = decimal
            // "12.345,50" → remove dots → "12345,50" → replace comma → "12345.50"
            s = s.replacingOccurrences(of: ".", with: "")
            s = s.replacingOccurrences(of: ",", with: ".")
        } else if hasDot {
            // Only dot → COP bias: treat as thousands separator
            // "1.500" → "1500"
            s = s.replacingOccurrences(of: ".", with: "")
        } else if hasComma {
            // Only comma → treat as decimal separator
            // "1500,50" → "1500.50"
            s = s.replacingOccurrences(of: ",", with: ".")
        }

        // Keep only digits and a single leading decimal point.
        // Allow exactly one period as decimal separator.
        let allowed = CharacterSet.decimalDigits.union(CharacterSet(charactersIn: "."))
        let filtered = s.unicodeScalars.filter { allowed.contains($0) }
        var cleaned = String(String.UnicodeScalarView(filtered))

        // Collapse multiple periods (edge case): keep only the last one.
        let parts = cleaned.components(separatedBy: ".")
        if parts.count > 2 {
            // More than one period — treat all but last as thousands, join intpart + decimal
            let integerPart = parts.dropLast().joined()
            let decimalPart = parts.last ?? ""
            cleaned = decimalPart.isEmpty ? integerPart : "\(integerPart).\(decimalPart)"
        }

        return cleaned
    }
}
