import SwiftUI

/// 2-column grid of 4 stat cards: Total Balance, Monthly Income, Monthly Expenses, Net.
/// Receives pre-computed values from the parent view — no logic lives here.
struct StatsGrid: View {
    let data: DashboardData
    let formatter: NumberFormatter
    let vm: DashboardViewModel

    // Pre-compute stats once during body evaluation.
    private var totalBalance: String {
        format(vm.totalBalance(from: data.accounts))
    }

    private var income: Decimal {
        vm.monthlyIncome(from: data.transactions)
    }

    private var expenses: Decimal {
        vm.monthlyExpenses(from: data.transactions)
    }

    private var net: Decimal {
        vm.netMonth(income: income, expenses: expenses)
    }

    var body: some View {
        LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible())],
            spacing: 12
        ) {
            StatCard(
                label: "Total Balance",
                value: totalBalance,
                iconName: "banknote",
                color: .blue
            )

            StatCard(
                label: "Monthly Income",
                value: format(income),
                iconName: "arrow.down.circle",
                color: .green
            )

            StatCard(
                label: "Monthly Expenses",
                value: format(expenses),
                iconName: "arrow.up.circle",
                color: .red
            )

            StatCard(
                label: "Net (Month)",
                value: format(net),
                iconName: net >= 0 ? "checkmark.circle" : "exclamationmark.circle",
                color: net >= 0 ? .green : .orange
            )
        }
    }

    // MARK: - Helpers

    private func format(_ value: Decimal) -> String {
        formatter.string(from: value as NSDecimalNumber) ?? "\(value)"
    }
}
