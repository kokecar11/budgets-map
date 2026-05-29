import SwiftUI

/// A single transaction row: amount (colored by type), category name, account name, date.
struct TransactionRow: View {
    let transaction: Transaction
    let data: DashboardData
    let formatter: NumberFormatter

    private var isIncome: Bool { transaction.type == .income }

    private var categoryName: String {
        guard let id = transaction.categoryId else { return "No Category" }
        return data.categoriesById[id]?.name ?? "Unknown Category"
    }

    private var accountName: String {
        guard let id = transaction.accountId else { return "No Account" }
        return data.accountsById[id]?.name ?? "Unknown Account"
    }

    private var formattedAmount: String {
        let absAmount = abs(transaction.amount)
        let number = formatter.string(from: absAmount as NSDecimalNumber) ?? "\(absAmount)"
        return isIncome ? "+\(number)" : "−\(number)"
    }

    private var formattedDate: String {
        transaction.date.formatted(date: .abbreviated, time: .omitted)
    }

    var body: some View {
        HStack(spacing: 12) {
            // Type indicator circle
            Circle()
                .fill(isIncome ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                .frame(width: 36, height: 36)
                .overlay {
                    Image(systemName: isIncome ? "arrow.down" : "arrow.up")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(isIncome ? .green : .red)
                }

            // Description
            VStack(alignment: .leading, spacing: 2) {
                Text(categoryName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)

                Text(accountName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            // Amount + date
            VStack(alignment: .trailing, spacing: 2) {
                Text(formattedAmount)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(isIncome ? .green : .red)

                Text(formattedDate)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }
}
