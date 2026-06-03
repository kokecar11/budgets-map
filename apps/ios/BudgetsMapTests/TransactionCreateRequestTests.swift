import XCTest
@testable import BudgetsMap

/// Unit tests for TransactionCreateRequest JSON encoding.
/// Verifies: snake_case keys, amount as JSON number, date as ISO8601 string,
/// and that nil optional fields are ABSENT from the encoded JSON (not null).
final class TransactionCreateRequestTests: XCTestCase {

    // MARK: - Helpers

    /// Encodes a `TransactionCreateRequest` and decodes the result into a raw [String: Any] dictionary.
    private func encodedDict(_ request: TransactionCreateRequest) throws -> [String: Any] {
        let data = try JSONCoding.encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        guard let dict = json as? [String: Any] else {
            XCTFail("Encoded JSON is not a dictionary")
            return [:]
        }
        return dict
    }

    // MARK: - Snake_case keys

    /// REQ-4 / REQ-3: optional fields use snake_case when present.
    func testSnakeCaseKeysWhenOptionalsPresent() throws {
        let date = ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z")!
        let accountUUID = "account-123"
        let categoryUUID = "category-456"
        let request = TransactionCreateRequest(
            type: .expense,
            amount: Decimal(1500),
            date: date,
            accountId: accountUUID,
            categoryId: categoryUUID,
            description: "Lunch"
        )
        let dict = try encodedDict(request)

        XCTAssertNotNil(dict["account_id"], "accountId should be encoded as 'account_id'")
        XCTAssertNotNil(dict["category_id"], "categoryId should be encoded as 'category_id'")
        XCTAssertNil(dict["accountId"], "camelCase 'accountId' key must NOT appear")
        XCTAssertNil(dict["categoryId"], "camelCase 'categoryId' key must NOT appear")
    }

    // MARK: - Amount is a JSON number

    /// REQ-4, Scenario 4-D: amount encoded as a JSON number, not a string.
    func testAmountEncodedAsNumber() throws {
        let date = ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z")!
        let request = TransactionCreateRequest(
            type: .expense,
            amount: Decimal(1500),
            date: date,
            accountId: nil,
            categoryId: nil,
            description: nil
        )
        let dict = try encodedDict(request)

        let amountValue = dict["amount"]
        XCTAssertNotNil(amountValue, "amount key must be present")
        // JSON number will be decoded as NSNumber by JSONSerialization.
        XCTAssertTrue(amountValue is NSNumber, "amount should decode as NSNumber (JSON number), got \(type(of: amountValue!))")
        // Also verify the numeric value is correct.
        if let number = amountValue as? NSNumber {
            XCTAssertEqual(number.decimalValue, Decimal(1500))
        }
    }

    /// Amount is NOT encoded as a string.
    func testAmountIsNotString() throws {
        let date = ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z")!
        let request = TransactionCreateRequest(
            type: .income,
            amount: Decimal(string: "99999.99")!,
            date: date,
            accountId: nil,
            categoryId: nil,
            description: nil
        )
        let dict = try encodedDict(request)
        XCTAssertFalse(dict["amount"] is String, "amount must NOT be a JSON string")
    }

    // MARK: - Date is ISO8601 string

    /// REQ-4, Scenario 4-D: date encoded as ISO8601 string.
    func testDateEncodedAsISO8601String() throws {
        let date = ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z")!
        let request = TransactionCreateRequest(
            type: .expense,
            amount: Decimal(1000),
            date: date,
            accountId: nil,
            categoryId: nil,
            description: nil
        )
        let dict = try encodedDict(request)

        let dateValue = dict["date"]
        XCTAssertNotNil(dateValue, "date key must be present")
        guard let dateString = dateValue as? String else {
            XCTFail("date must be encoded as a String (ISO8601)")
            return
        }
        // Must be a valid ISO8601 date.
        let reparsed = ISO8601DateFormatter().date(from: dateString)
        XCTAssertNotNil(reparsed, "Encoded date string '\(dateString)' must be parseable as ISO8601")
    }

    // MARK: - Nil optionals are ABSENT (not null)

    /// REQ-4, Scenario 4-A: nil account_id, category_id, description are absent from JSON.
    func testNilOptionalsAbsentFromJSON() throws {
        let date = ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z")!
        let request = TransactionCreateRequest(
            type: .expense,
            amount: Decimal(1500),
            date: date,
            accountId: nil,
            categoryId: nil,
            description: nil
        )
        let dict = try encodedDict(request)

        XCTAssertNil(dict["account_id"],   "nil accountId must NOT appear in JSON (not null)")
        XCTAssertNil(dict["category_id"],  "nil categoryId must NOT appear in JSON (not null)")
        XCTAssertNil(dict["description"],  "nil description must NOT appear in JSON (not null)")
    }

    /// REQ-4: user_id is never included in the request body.
    func testUserIdAbsentFromJSON() throws {
        let date = ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z")!
        let request = TransactionCreateRequest(
            type: .expense,
            amount: Decimal(1500),
            date: date,
            accountId: nil,
            categoryId: nil,
            description: nil
        )
        let dict = try encodedDict(request)
        XCTAssertNil(dict["user_id"],  "user_id must NEVER be in the request body")
        XCTAssertNil(dict["userId"],   "userId must NEVER be in the request body")
    }

    // MARK: - Type encoding

    /// type is encoded as a snake_case raw-value string matching the backend literal.
    func testTypeEncodedAsRawValueString() throws {
        let date = ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z")!
        let cases: [(TransactionType, String)] = [
            (.income, "income"),
            (.expense, "expense"),
            (.transfer, "transfer"),
            (.saving, "saving"),
            (.creditCardCharge, "credit_card_charge"),
        ]
        for (transactionType, expectedRaw) in cases {
            let request = TransactionCreateRequest(
                type: transactionType,
                amount: Decimal(100),
                date: date,
                accountId: nil,
                categoryId: nil,
                description: nil
            )
            let dict = try encodedDict(request)
            XCTAssertEqual(dict["type"] as? String, expectedRaw,
                           "TransactionType.\(transactionType) should encode as '\(expectedRaw)'")
        }
    }

    // MARK: - Full payload with all fields present

    func testFullPayloadWithAllFields() throws {
        let date = ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z")!
        let request = TransactionCreateRequest(
            type: .expense,
            amount: Decimal(52200),
            date: date,
            accountId: "acc-uuid",
            categoryId: "cat-uuid",
            description: "Mercado semanal"
        )
        let dict = try encodedDict(request)

        XCTAssertEqual(dict["type"] as? String, "expense")
        XCTAssertEqual((dict["amount"] as? NSNumber)?.decimalValue, Decimal(52200))
        XCTAssertNotNil(dict["date"] as? String)
        XCTAssertEqual(dict["account_id"] as? String, "acc-uuid")
        XCTAssertEqual(dict["category_id"] as? String, "cat-uuid")
        XCTAssertEqual(dict["description"] as? String, "Mercado semanal")
        XCTAssertNil(dict["user_id"])
    }
}
