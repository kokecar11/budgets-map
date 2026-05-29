import SwiftUI

/// A single stat card displaying a label, formatted value, and optional SF Symbol icon.
struct StatCard: View {
    let label: String
    let value: String
    let iconName: String?
    let color: Color

    init(label: String, value: String, iconName: String? = nil, color: Color = .primary) {
        self.label = label
        self.value = value
        self.iconName = iconName
        self.color = color
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                if let iconName {
                    Image(systemName: iconName)
                        .font(.footnote)
                        .foregroundStyle(color)
                }
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    StatCard(label: "Total Balance", value: "$12,345 COP", iconName: "banknote", color: .blue)
        .padding()
}
