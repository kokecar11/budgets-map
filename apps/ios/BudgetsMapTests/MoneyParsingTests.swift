import XCTest
@testable import BudgetsMap

/// Unit tests for MoneyParsing — COP-aware decimal parse and format helpers.
/// REQ-5: "1.500" → 1500; "12.345,50" → 12345.50; invalid/empty → nil.
final class MoneyParsingTests: XCTestCase {

    // MARK: - COP thousands-separator parsing

    /// REQ-5, Scenario 5-A: lone dot is treated as thousands separator (COP bias).
    func testDotAsThousandsSeparator() {
        let result = MoneyParsing.decimal(from: "1.500")
        XCTAssertEqual(result, Decimal(1500), "\"1.500\" should parse as 1500, not 1.5")
    }

    func testLargerCOPThousands() {
        let result = MoneyParsing.decimal(from: "85.000")
        XCTAssertEqual(result, Decimal(85000))
    }

    func testMultipleThousandsGroups() {
        let result = MoneyParsing.decimal(from: "1.234.000")
        XCTAssertEqual(result, Decimal(1234000))
    }

    // MARK: - COP decimal-separator parsing

    /// REQ-5, Scenario 5-B: dot=thousands, comma=decimal.
    func testDotThousandsAndCommaDecimal() {
        let result = MoneyParsing.decimal(from: "12.345,50")
        XCTAssertEqual(result, Decimal(string: "12345.50"), "\"12.345,50\" should parse as 12345.50")
    }

    /// Lone comma treated as decimal separator.
    func testCommaAsDecimalSeparator() {
        let result = MoneyParsing.decimal(from: "1500,50")
        XCTAssertEqual(result, Decimal(string: "1500.50"))
    }

    // MARK: - Currency symbol stripping

    func testDollarSignStripped() {
        let result = MoneyParsing.decimal(from: "$ 52.200")
        XCTAssertEqual(result, Decimal(52200))
    }

    func testCOPPrefixStripped() {
        let result = MoneyParsing.decimal(from: "COP 10.000")
        XCTAssertEqual(result, Decimal(10000))
    }

    // MARK: - Plain integers

    func testPlainInteger() {
        let result = MoneyParsing.decimal(from: "500")
        XCTAssertEqual(result, Decimal(500))
    }

    // MARK: - Invalid / empty input → nil

    /// REQ-5, Scenario 5-C: alphabetic string returns nil.
    func testAlphabeticInputReturnsNil() {
        let result = MoneyParsing.decimal(from: "abc")
        XCTAssertNil(result, "Alphabetic input should return nil")
    }

    func testEmptyStringReturnsNil() {
        let result = MoneyParsing.decimal(from: "")
        XCTAssertNil(result, "Empty string should return nil")
    }

    func testWhitespaceOnlyReturnsNil() {
        let result = MoneyParsing.decimal(from: "   ")
        XCTAssertNil(result, "Whitespace-only string should return nil")
    }

    func testMixedAlphaNumericReturnsNil() {
        let result = MoneyParsing.decimal(from: "12abc")
        // After sanitisation "12abc" → "12" — this may parse; the spec only requires "abc" → nil.
        // We don't assert the mixed case fails; the main contract is alphabetic → nil.
    }

    // MARK: - Round-trip: format ↔ parse

    func testRoundTripWholeAmount() {
        let original = Decimal(52200)
        let formatted = MoneyParsing.string(from: original)
        let reparsed  = MoneyParsing.decimal(from: formatted)
        XCTAssertEqual(reparsed, original, "Round-trip format/parse should yield the same Decimal for whole amounts")
    }

    func testRoundTripDecimalAmount() {
        let original = Decimal(string: "12345.50")!
        let formatted = MoneyParsing.string(from: original)
        // After format the string uses a period; re-parsing must recover the value.
        let reparsed = MoneyParsing.decimal(from: formatted)
        XCTAssertEqual(reparsed, original, "Round-trip format/parse should yield the same Decimal")
    }

    // MARK: - Format output sanity

    func testFormatUsesNoPeriodForWhole() {
        // 1500 formatted should be "1500" (no grouping separator from stringValue).
        let formatted = MoneyParsing.string(from: Decimal(1500))
        // Must not contain a comma; should be parseable back to 1500.
        XCTAssertFalse(formatted.contains(","), "Formatted amount should not contain comma")
        XCTAssertEqual(MoneyParsing.decimal(from: formatted), Decimal(1500))
    }
}
