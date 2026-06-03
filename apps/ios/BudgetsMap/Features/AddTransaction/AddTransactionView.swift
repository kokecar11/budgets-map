import SwiftUI
import VisionKit

/// Sheet for creating a new transaction.
///
/// Receives an already-initialised `AddTransactionViewModel` from the caller
/// (DashboardViewModel factory), so it makes no direct networking calls.
/// The "Scan receipt" button launches `DocumentScannerView` (physical device only),
/// runs Vision OCR, parses the result, and prefills the form for user review.
/// For PRO users, the VM may fire an async LLM enhancement call after the initial
/// heuristic prefill — the `isEnhancing` overlay communicates this non-blockingly.
struct AddTransactionView: View {

    @Environment(\.dismiss) private var dismiss
    @Bindable var viewModel: AddTransactionViewModel

    // MARK: - Scanner state

    @State private var showScanner: Bool = false
    @State private var scannerErrorMessage: String? = nil
    @State private var showScannerError: Bool = false
    @State private var showPermissionDenied: Bool = false

    var body: some View {
        NavigationStack {
            Form {
                // MARK: Type
                Section("Transaction Type") {
                    Picker("Type", selection: $viewModel.type) {
                        ForEach(TransactionType.allCases, id: \.self) { txType in
                            Text(txType.displayName).tag(txType)
                        }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: viewModel.type) { _, _ in
                        viewModel.resetCategoryIfNeeded()
                    }
                }

                // MARK: Amount
                Section("Amount") {
                    TextField("0", text: $viewModel.amountText)
                        .keyboardType(.decimalPad)
                }

                // MARK: Date
                Section("Date") {
                    DatePicker(
                        "Date",
                        selection: $viewModel.date,
                        in: ...Date.now,
                        displayedComponents: .date
                    )
                    .datePickerStyle(.compact)
                }

                // MARK: Category (filtered by type)
                if !viewModel.filteredCategories.isEmpty {
                    Section("Category") {
                        Picker("Category", selection: $viewModel.selectedCategoryId) {
                            Text("None").tag(String?.none)
                            ForEach(viewModel.filteredCategories) { category in
                                Text(category.name).tag(Optional(category.id))
                            }
                        }
                    }
                }

                // MARK: Account
                if !viewModel.accounts.isEmpty {
                    Section("Account") {
                        Picker("Account", selection: $viewModel.selectedAccountId) {
                            Text("None").tag(String?.none)
                            ForEach(viewModel.accounts) { account in
                                Text(account.name).tag(Optional(account.id))
                            }
                        }
                    }
                }

                // MARK: Description
                Section("Description (optional)") {
                    TextField("Add a note…", text: $viewModel.descriptionText)
                }

                // MARK: Scan receipt
                Section {
                    Button {
                        Task { await launchScanner() }
                    } label: {
                        Label("Scan Receipt", systemImage: "doc.viewfinder")
                    }
                    // Show permission-denied inline feedback when applicable.
                    if showPermissionDenied {
                        HStack(spacing: 8) {
                            Image(systemName: "camera.fill")
                                .foregroundStyle(.secondary)
                            Text("Camera access denied. Enable it in Settings to use receipt scanning.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    // LLM enhancement in-progress indicator.
                    if viewModel.isEnhancing {
                        HStack(spacing: 8) {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Analyzing with AI…")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    // Non-blocking message after scan (cap-reached, degradation, upsell hint).
                    if let message = viewModel.scanMessage {
                        Text(message)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.vertical, 2)
                    }
                } footer: {
                    Text("Scan a receipt to automatically fill in the amount, date, and description.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // MARK: Save error
                if let error = viewModel.errorMessage {
                    Section {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }
            }
            .navigationTitle("New Transaction")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await viewModel.save() }
                    } label: {
                        if viewModel.isSaving {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Text("Save")
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSaving)
                }
            }
            .onChange(of: viewModel.didSave) { _, saved in
                if saved { dismiss() }
            }
            // Scanner sheet (physical device only — guarded by isSupported check in launchScanner).
            .sheet(isPresented: $showScanner) {
                DocumentScannerView(
                    onResult: { result, lines in
                        showScanner = false
                        Task { await viewModel.handleScan(result: result, lines: lines) }
                    },
                    onCancel: {
                        showScanner = false
                    },
                    onError: { error in
                        showScanner = false
                        scannerErrorMessage = error.localizedDescription
                        showScannerError = true
                    }
                )
            }
            .alert("Scan Failed", isPresented: $showScannerError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(scannerErrorMessage ?? "An unexpected error occurred during scanning.")
            }
        }
    }

    // MARK: - Private helpers

    /// Checks camera permission, then either presents the scanner or sets the
    /// permission-denied flag so an inline message is shown.
    private func launchScanner() async {
        // VNDocumentCameraViewController is unavailable on Simulator.
        guard VNDocumentCameraViewController.isSupported else {
            scannerErrorMessage = "Receipt scanning requires a physical device with a camera."
            showScannerError = true
            return
        }

        let granted = await CameraPermission.ensureAccess()
        if granted {
            showPermissionDenied = false
            showScanner = true
        } else {
            showPermissionDenied = true
        }
    }
}
