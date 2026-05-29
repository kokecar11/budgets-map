import SwiftUI

/// Displays up to 10 recent transactions (pre-sorted, pre-capped by the ViewModel).
struct RecentTransactionsList: View {
    let transactions: [Transaction]
    let data: DashboardData
    let formatter: NumberFormatter

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Transactions")
                .font(.headline)
                .padding(.horizontal)

            if transactions.isEmpty {
                ContentUnavailableView(
                    "No Transactions",
                    systemImage: "tray",
                    description: Text("Your recent transactions will appear here.")
                )
                .padding(.vertical)
            } else {
                VStack(spacing: 0) {
                    ForEach(transactions) { transaction in
                        TransactionRow(
                            transaction: transaction,
                            data: data,
                            formatter: formatter
                        )
                        .padding(.horizontal)

                        if transaction.id != transactions.last?.id {
                            Divider()
                                .padding(.leading, 60)
                        }
                    }
                }
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)
            }
        }
    }
}
