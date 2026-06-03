import Foundation

/// The parsed output from a receipt OCR scan.
/// All fields are optional — only what the parser could confidently extract is populated.
/// Used to prefill `AddTransactionViewModel` fields; the user must confirm before saving.
struct ReceiptScanResult: Sendable, Equatable {
    let amount: Decimal?
    let date: Date?
    let merchant: String?
    let currency: String?
    /// Category UUID returned by the LLM endpoint (guaranteed ∈ user's categories or nil).
    /// Always `nil` from the on-device `ReceiptParser`; populated only from the LLM response.
    let categoryId: String?
    /// Transaction type returned by the LLM endpoint (`income` or `expense`).
    /// Always `nil` from the on-device `ReceiptParser`; populated only from the LLM response.
    let type: TransactionType?

    init(
        amount: Decimal? = nil,
        date: Date? = nil,
        merchant: String? = nil,
        currency: String? = nil,
        categoryId: String? = nil,
        type: TransactionType? = nil
    ) {
        self.amount = amount
        self.date = date
        self.merchant = merchant
        self.currency = currency
        self.categoryId = categoryId
        self.type = type
    }

    /// `true` when the on-device heuristic could not extract a grand total.
    /// Used to decide whether to escalate to the LLM endpoint (PRO users only).
    var needsLLM: Bool { amount == nil }
}
