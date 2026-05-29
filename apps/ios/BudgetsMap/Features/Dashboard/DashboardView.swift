import SwiftUI

/// Dashboard screen — stats, recent transactions, accounts list.
/// Handles loading / error / partial-failure / empty states.
struct DashboardView: View {

    @State private var vm: DashboardViewModel
    private let sessionStore: SessionStore
    private let session: Session

    init(apiClient: APIClient, sessionStore: SessionStore, session: Session) {
        self.sessionStore = sessionStore
        self.session = session
        _vm = State(initialValue: DashboardViewModel(apiClient: apiClient, sessionStore: sessionStore))
    }

    var body: some View {
        NavigationStack {
            Group {
                switch vm.state {
                case .idle, .loading:
                    loadingView

                case .failed(let message):
                    errorView(message: message)

                case .loaded(let data):
                    loadedView(data: data)
                }
            }
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await sessionStore.signOut() }
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                            .labelStyle(.iconOnly)
                    }
                }
            }
        }
        .task {
            await vm.load()
        }
    }

    // MARK: - Sub-views

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.4)
            Text("Loading your data…")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func errorView(message: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 40)

            Button("Retry") {
                Task { await vm.load() }
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func loadedView(data: DashboardData) -> some View {
        let formatter = vm.currencyFormatter(for: session)
        let recent = vm.recentTransactions(from: data.transactions)

        return ScrollView {
            LazyVStack(alignment: .leading, spacing: 24) {

                // Partial-failure banner
                if let warning = data.partialFailureMessage {
                    HStack(spacing: 10) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                        Text(warning)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 10)
                    .background(Color.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
                    .padding(.horizontal)
                }

                // Stats grid
                StatsGrid(data: data, formatter: formatter, vm: vm)
                    .padding(.horizontal)

                // Recent transactions
                RecentTransactionsList(
                    transactions: recent,
                    data: data,
                    formatter: formatter
                )

                // Accounts list
                AccountsList(accounts: data.accounts, formatter: formatter)
            }
            .padding(.vertical)
        }
        .refreshable {
            await vm.refresh()
        }
    }
}
