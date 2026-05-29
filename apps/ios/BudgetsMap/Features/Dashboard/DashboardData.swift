import Foundation

/// Assembled view data for the Dashboard.
/// Built once by `DashboardViewModel` after all three concurrent GETs complete.
/// Includes lookup maps for O(1) client-side joins in `TransactionRow`.
struct DashboardData: Sendable {
    let transactions: [Transaction]
    let accounts: [Account]
    let categories: [Category]

    /// Keyed by `account.id` — used for fast name lookup in transaction rows.
    let accountsById: [String: Account]
    /// Keyed by `category.id` — used for fast name lookup in transaction rows.
    let categoriesById: [String: Category]

    /// Non-nil when one or more endpoints failed (partial-failure tolerance).
    let partialFailureMessage: String?

    init(
        transactions: [Transaction],
        accounts: [Account],
        categories: [Category],
        partialFailureMessage: String? = nil
    ) {
        self.transactions = transactions
        self.accounts = accounts
        self.categories = categories
        self.partialFailureMessage = partialFailureMessage

        // Build lookup maps once at construction; used repeatedly in the view.
        self.accountsById = Dictionary(
            uniqueKeysWithValues: accounts.map { ($0.id, $0) }
        )
        self.categoriesById = Dictionary(
            uniqueKeysWithValues: categories.map { ($0.id, $0) }
        )
    }
}
