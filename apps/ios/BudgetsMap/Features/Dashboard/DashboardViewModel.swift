import Foundation
import Observation

/// Generic load state for any async data source.
enum LoadState<T: Sendable>: Sendable {
    case idle
    case loading
    case loaded(T)
    case failed(String)
}

/// ViewModel for the Dashboard screen.
/// Fires 3 concurrent GETs, tolerates partial failures (mirrors `Promise.allSettled`),
/// and computes stats client-side from the fetched data.
@MainActor
@Observable
final class DashboardViewModel {

    // MARK: - State

    private(set) var state: LoadState<DashboardData> = .idle

    // MARK: - Dependencies

    private let apiClient: APIClient
    private let sessionStore: SessionStore

    init(apiClient: APIClient, sessionStore: SessionStore) {
        self.apiClient = apiClient
        self.sessionStore = sessionStore
    }

    // MARK: - Data loading

    /// Fires transactions, accounts, and categories GETs concurrently.
    /// One or two failures are tolerated — the screen stays usable with partial data.
    func load() async {
        state = .loading

        // --- Concurrent fetches via async let (Swift structured concurrency) ---
        async let txResult: Result<[Transaction], Error> = fetchResult(Endpoint.transactions)
        async let acResult: Result<[Account], Error> = fetchResult(Endpoint.accounts)
        async let catResult: Result<[Category], Error> = fetchResult(Endpoint.categories)

        let (txRes, acRes, catRes) = await (txResult, acResult, catResult)

        // --- Auth-failure guard: if any fetch triggered signOut(), stop here.
        // RootView is already routing to Login; don't overwrite state with a
        // transient error banner. ---
        guard sessionStore.currentSession != nil else { return }

        // --- Collect results, tolerating partial failures ---
        var failedEndpoints: [String] = []

        let transactions: [Transaction]
        switch txRes {
        case .success(let value): transactions = value
        case .failure:
            transactions = []
            failedEndpoints.append("Transactions")
        }

        let accounts: [Account]
        switch acRes {
        case .success(let value): accounts = value
        case .failure:
            accounts = []
            failedEndpoints.append("Accounts")
        }

        let categories: [Category]
        switch catRes {
        case .success(let value): categories = value
        case .failure:
            categories = []
            failedEndpoints.append("Categories")
        }

        // --- All three failed → hard error state ---
        if failedEndpoints.count == 3 {
            state = .failed("Could not load data. Check your connection and try again.")
            return
        }

        // --- At least one succeeded → loaded with optional partial-failure banner ---
        let partialMessage: String? = failedEndpoints.isEmpty
            ? nil
            : "Some data couldn't be loaded: \(failedEndpoints.joined(separator: ", "))."

        let data = DashboardData(
            transactions: transactions,
            accounts: accounts,
            categories: categories,
            partialFailureMessage: partialMessage
        )
        state = .loaded(data)
    }

    /// Alias for pull-to-refresh — re-runs `load()`.
    func refresh() async {
        await load()
    }

    // MARK: - Client-side stats

    /// Sum of balances for all active accounts.
    func totalBalance(from accounts: [Account]) -> Decimal {
        accounts
            .filter { $0.isActive }
            .reduce(Decimal(0)) { $0 + $1.balance }
    }

    /// Sum of income transaction amounts for the month containing `date`.
    func monthlyIncome(from transactions: [Transaction], in date: Date = Date()) -> Decimal {
        transactions
            .filter { tx in
                tx.type == .income &&
                Calendar.current.isDate(tx.date, equalTo: date, toGranularity: .month)
            }
            .reduce(Decimal(0)) { $0 + $1.amount }
    }

    /// Sum of expense transaction amounts for the month containing `date`.
    func monthlyExpenses(from transactions: [Transaction], in date: Date = Date()) -> Decimal {
        transactions
            .filter { tx in
                tx.type == .expense &&
                Calendar.current.isDate(tx.date, equalTo: date, toGranularity: .month)
            }
            .reduce(Decimal(0)) { $0 + $1.amount }
    }

    /// Net = income − expenses (can be negative).
    func netMonth(income: Decimal, expenses: Decimal) -> Decimal {
        income - expenses
    }

    /// Last 10 transactions by date descending.
    func recentTransactions(from transactions: [Transaction]) -> [Transaction] {
        Array(transactions.sorted { $0.date > $1.date }.prefix(10))
    }

    /// A `NumberFormatter` configured for the session's currency code.
    func currencyFormatter(for session: Session) -> NumberFormatter {
        let fmt = NumberFormatter()
        fmt.numberStyle = .currency
        fmt.currencyCode = session.currency
        return fmt
    }

    // MARK: - Private helpers

    /// Wraps a throwing `APIClient.request` call in a `Result` so one failure
    /// doesn't abort the other concurrent requests.
    ///
    /// **Auth-failure special case (REQ-3-B / REQ-3-D):** If `APIClient` throws
    /// `APIError.unauthorized` — meaning the reactive refresh+retry also returned 401,
    /// i.e. the session is truly invalid — or if the refresh itself fails (propagated as
    /// `APIError.unauthorized` or `APIError.missingToken`), this method calls
    /// `sessionStore.signOut()` and returns `.failure` so the caller can short-circuit.
    /// Transient errors (network blips, 5xx, decoding failures) still use the normal
    /// partial-failure banner path.
    private func fetchResult<T: Decodable & Sendable>(_ endpoint: Endpoint) async -> Result<T, Error> {
        do {
            let value: T = try await apiClient.request(endpoint)
            return .success(value)
        } catch let error as APIError {
            switch error {
            case .unauthorized, .missingToken:
                // Session is truly invalid (post-retry 401 or no token at all).
                // Sign out so RootView routes back to Login — do not surface as a banner.
                await sessionStore.signOut()
                return .failure(error)
            default:
                return .failure(error)
            }
        } catch {
            return .failure(error)
        }
    }
}
