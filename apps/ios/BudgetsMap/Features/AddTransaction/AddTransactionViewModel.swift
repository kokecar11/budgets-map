import Foundation
import Observation

/// ViewModel for the Add Transaction sheet.
///
/// Injected with the categories and accounts already fetched by DashboardViewModel,
/// so the sheet makes zero extra network calls for those resources.
/// The `apiClient` stays encapsulated — callers obtain this VM via
/// `DashboardViewModel.makeAddTransactionViewModel(onSaved:)`.
@MainActor
@Observable
final class AddTransactionViewModel {

    // MARK: - Form state

    var type: TransactionType = .expense
    var amountText: String = ""
    var date: Date = .now
    var selectedCategoryId: String? = nil
    var selectedAccountId: String? = nil
    var descriptionText: String = ""

    // MARK: - UI state

    var isSaving: Bool = false
    var errorMessage: String? = nil
    /// Set to `true` on a successful save; observed by the View to trigger dismiss.
    var didSave: Bool = false

    /// `true` while the LLM enhancement call is in-flight; drives a spinner overlay.
    var isEnhancing: Bool = false
    /// Non-blocking message shown after the LLM call completes (success, cap-reached, or failure).
    var scanMessage: String? = nil

    // MARK: - Read-only data

    let accounts: [Account]
    private let allCategories: [Category]

    // MARK: - Dependencies

    private let apiClient: APIClient
    private let onSaved: @MainActor () -> Void
    /// The authenticated user's plan (e.g. `"pro"`, `"free"`).
    /// Passed from the `DashboardViewModel` factory so the VM stays independently testable.
    private let plan: String

    // MARK: - Init

    init(
        apiClient: APIClient,
        accounts: [Account],
        categories: [Category],
        plan: String,
        onSaved: @escaping @MainActor () -> Void
    ) {
        self.apiClient = apiClient
        self.accounts = accounts
        self.allCategories = categories
        self.plan = plan
        self.onSaved = onSaved
    }

    // MARK: - Derived

    /// Categories matching the currently selected transaction type.
    /// Only income and expense categories exist; other types yield an empty list.
    var filteredCategories: [Category] {
        switch type {
        case .income:
            return allCategories.filter { $0.type == .income }
        case .expense:
            return allCategories.filter { $0.type == .expense }
        case .transfer, .saving, .creditCardCharge:
            // No category concept for these types at the category level.
            return []
        }
    }

    /// Parsed `Decimal` from the current `amountText`, or `nil` if unparseable.
    var parsedAmount: Decimal? {
        MoneyParsing.decimal(from: amountText)
    }

    /// Save is enabled only when the amount field contains a valid positive number.
    var isValid: Bool {
        guard let amount = parsedAmount else { return false }
        return amount > 0
    }

    // MARK: - Actions

    /// Validates and POSTs the transaction. Sets `didSave` on success or
    /// `errorMessage` on failure. Idempotency guard via `isSaving`.
    func save() async {
        guard isValid, !isSaving else { return }

        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let amount = parsedAmount ?? 0
        let descriptionValue: String? = descriptionText.trimmingCharacters(in: .whitespaces).isEmpty
            ? nil
            : descriptionText.trimmingCharacters(in: .whitespaces)

        let requestBody = TransactionCreateRequest(
            type: type,
            amount: amount,
            date: date,
            accountId: selectedAccountId,
            categoryId: selectedCategoryId,
            description: descriptionValue
        )

        do {
            _ = try await apiClient.createTransaction(requestBody)
            onSaved()
            didSave = true
        } catch let apiError as APIError {
            switch apiError {
            case .unauthorized:
                errorMessage = "Session expired. Please sign in again."
            default:
                errorMessage = "Couldn't save the transaction. Please try again."
            }
        } catch {
            errorMessage = "Couldn't save the transaction. Please try again."
        }
    }

    /// Prefills form fields from a receipt scan result.
    ///
    /// Applies `amount`, `date`, and `merchant` from the heuristic result.
    /// Also applies `categoryId` and `type` when populated by the LLM response.
    /// Existing user edits to non-empty fields are NOT overwritten (merchant/description guard).
    func applyScan(_ result: ReceiptScanResult) {
        if let amount = result.amount {
            amountText = MoneyParsing.string(from: amount)
        }
        if let scannedDate = result.date {
            date = scannedDate
        }
        // Prefill description only when the field is still empty.
        if let merchant = result.merchant, descriptionText.trimmingCharacters(in: .whitespaces).isEmpty {
            descriptionText = merchant
        }
        // LLM-only fields: apply only if present so heuristic calls are unaffected.
        if let catId = result.categoryId {
            selectedCategoryId = catId
        }
        if let txType = result.type {
            type = txType
        }
    }

    /// Two-stage receipt scan handler:
    ///
    /// 1. Immediately prefills the form with the heuristic `result` so the user can interact at once.
    /// 2. If the heuristic needs enhancement (`result.needsLLM`) AND the user is PRO, fires the LLM
    ///    endpoint and refines the prefill with the richer result.
    /// 3. On any error (403/429/network/timeout) the heuristic prefill stays intact; a non-blocking
    ///    `scanMessage` is shown if appropriate.
    ///
    /// Runs on MainActor (all UI mutations are synchronous on the actor;
    /// `apiClient.scanReceiptText` hops off-actor internally via URLSession).
    func handleScan(result: ReceiptScanResult, lines: [String]) async {
        // Step 1 — heuristic prefill (never blocks the form).
        applyScan(result)
        scanMessage = nil

        // Step 2 — LLM escalation guard.
        guard result.needsLLM else { return }
        guard plan == "pro" else {
            // Non-PRO: keep heuristic result; optionally surface a subtle upsell hint.
            scanMessage = "Upgrade to PRO to get smarter receipt scanning."
            return
        }

        // Step 3 — LLM call (PRO + needs enhancement).
        isEnhancing = true
        defer { isEnhancing = false }

        do {
            let llmResult = try await apiClient.scanReceiptText(lines: lines)
            applyScan(llmResult)
        } catch let apiError as APIError {
            // Keep the heuristic prefill intact; map error to a user-friendly message.
            switch apiError {
            case .httpError(let code) where code == 429:
                scanMessage = "Monthly scan limit reached."
            case .httpError(let code) where code == 403:
                // Silently absorb — client-side plan gate already ran; shouldn't reach here.
                break
            default:
                scanMessage = "Couldn't enhance the scan; using the quick read."
            }
        } catch {
            scanMessage = "Couldn't enhance the scan; using the quick read."
        }
    }

    // MARK: - Category reset on type change

    /// Called when `type` changes to reset an incompatible category selection.
    func resetCategoryIfNeeded() {
        guard let catId = selectedCategoryId else { return }
        let stillValid = filteredCategories.contains { $0.id == catId }
        if !stillValid {
            selectedCategoryId = nil
        }
    }
}
