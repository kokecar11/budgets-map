import SwiftUI

/// Displays all active accounts with name, type, and formatted balance.
struct AccountsList: View {
    let accounts: [Account]
    let formatter: NumberFormatter

    /// Filters to only active accounts defensively (VM may already filter, but view is safe).
    private var activeAccounts: [Account] {
        accounts.filter { $0.isActive }
    }

    private func readableType(_ type: AccountType) -> String {
        switch type {
        case .bank:          return "Bank"
        case .cash:          return "Cash"
        case .digitalWallet: return "Digital Wallet"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Accounts")
                .font(.headline)
                .padding(.horizontal)

            if activeAccounts.isEmpty {
                ContentUnavailableView(
                    "No Accounts",
                    systemImage: "creditcard",
                    description: Text("Your active accounts will appear here.")
                )
                .padding(.vertical)
            } else {
                VStack(spacing: 0) {
                    ForEach(activeAccounts) { account in
                        HStack(spacing: 12) {
                            // Icon
                            Circle()
                                .fill(Color.blue.opacity(0.12))
                                .frame(width: 36, height: 36)
                                .overlay {
                                    Image(systemName: accountIcon(account.type))
                                        .font(.caption)
                                        .foregroundStyle(.blue)
                                }

                            VStack(alignment: .leading, spacing: 2) {
                                Text(account.name)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .lineLimit(1)

                                Text(readableType(account.type))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Text(
                                formatter.string(from: account.balance as NSDecimalNumber)
                                    ?? "\(account.balance)"
                            )
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 10)

                        if account.id != activeAccounts.last?.id {
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

    // MARK: - Helpers

    private func accountIcon(_ type: AccountType) -> String {
        switch type {
        case .bank:          return "building.columns"
        case .cash:          return "banknote"
        case .digitalWallet: return "phone"
        }
    }
}
