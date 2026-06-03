import Foundation

/// Pure, side-effect-free receipt-text heuristic parser.
///
/// Takes an ordered array of OCR text lines (as produced by Vision) and returns a
/// `ReceiptScanResult` with whatever fields could be confidently extracted.
/// Never throws; never crashes; returns nils for anything it cannot parse.
///
/// Amount heuristic (COP-biased, invoice-aware):
///   1. Scan tiered "total" keywords (most specific first: "total a pagar" >
///      "total"). A line qualifies only if it is NOT a component line
///      (subtotal, IVA, cambio, efectivo, recibido, descuento…). The "IVA
///      incluido" case is kept (it IS the grand total). Within the best tier,
///      the LARGEST value wins (the grand total ≥ any partial total).
///   2. Fallback: largest *plausible* monetary token, skipping component lines and
///      phone / NIT / invoice-number tokens.
///   3. Nil if no monetary token exists.
///
/// Date heuristic: try a set of fixed-format DateFormatters against every line;
/// first match wins. Intentionally avoids NSDataDetector (locale-sensitive, slow
/// to initialise) in favour of cheap, deterministic formatters.
///
/// Merchant heuristic: first non-empty line that is not predominantly numeric
/// and not a recognised boilerplate keyword.
struct ReceiptParser {

    // MARK: - Public API

    func parse(lines: [String]) -> ReceiptScanResult {
        let trimmed = lines.map { $0.trimmingCharacters(in: .whitespaces) }

        let amount   = extractAmount(from: trimmed)
        let date     = extractDate(from: trimmed)
        let merchant = extractMerchant(from: trimmed)
        let currency = trimmed.joined().contains("$") || trimmed.joined().uppercased().contains("COP")
                       ? "COP" : nil

        return ReceiptScanResult(amount: amount, date: date, merchant: merchant, currency: currency)
    }

    // MARK: - Amount extraction

    /// Total-label keywords in priority tiers (most specific first).
    /// Matched case- and diacritics-insensitively.
    private var totalKeywordTiers: [[String]] {
        [
            // Tier 1 — explicit "what you actually pay".
            ["total a pagar", "neto a pagar", "valor a pagar", "total a cancelar",
             "total factura", "total venta", "total compra", "gran total", "importe total"],
            // Tier 2 — generic total.
            ["valor total", "total pagado", "total"],
        ]
    }

    private func extractAmount(from lines: [String]) -> Decimal? {
        // Pass 1: walk the keyword tiers in priority order. Within the first tier that
        // yields candidates, return the LARGEST amount — the grand total is the biggest
        // of any total-labelled value (total ≥ subtotal). A line is skipped if it is a
        // component line (subtotal / IVA / cambio / efectivo / recibido / descuento…).
        for tier in totalKeywordTiers {
            var candidates: [Decimal] = []
            for (index, line) in lines.enumerated() {
                let normalised = normalize(line)
                guard tier.contains(where: { normalised.contains($0) }) else { continue }
                guard !isComponentLine(normalised) else { continue }

                // The amount usually sits on the same line; some receipts print it next.
                if let amount = largestMonetaryValue(in: line) {
                    candidates.append(amount)
                } else if index + 1 < lines.count, let next = largestMonetaryValue(in: lines[index + 1]) {
                    candidates.append(next)
                }
            }
            if let best = candidates.max() { return best }
        }

        // Pass 2: fallback — largest *plausible* monetary token among non-component
        // lines (so EFECTIVO / CAMBIO / RECIBIDO and phone / NIT numbers never win).
        var fallback: [Decimal] = []
        for line in lines {
            let normalised = normalize(line)
            guard !isComponentLine(normalised) else { continue }
            fallback.append(contentsOf: monetaryValues(in: line, plausibleOnly: true))
        }
        return fallback.max()
    }

    private func normalize(_ line: String) -> String {
        line.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
    }

    /// A line that holds a *component* amount (never the grand total).
    /// `normalised` must already be case/diacritics-folded.
    private func isComponentLine(_ normalised: String) -> Bool {
        let hard = [
            "subtotal", "sub total", "sub-total",
            "cambio", "vuelto",
            "efectivo", "recibido", "recibe", "entregado", "paga con", "pago con",
            "descuento", "propina",
            "cantidad", "unidades", "articulos",
            "telefono", "celular", "nit", "cedula",
            "resolucion", "autorizacion",
        ]
        if hard.contains(where: { normalised.contains($0) }) { return true }

        // IVA / tax lines are components — UNLESS the line says the tax is included,
        // in which case it's actually the grand total ("TOTAL IVA INCLUIDO $50.000").
        if normalised.contains("iva") || normalised.contains("impuesto") {
            let includesTax = ["incluido", "incluye", "incl"].contains { normalised.contains($0) }
            if !includesTax { return true }
        }
        return false
    }

    /// All money-like values on a line. When `plausibleOnly` is true, filters out
    /// tokens that look like phone numbers / invoice numbers and absurd magnitudes.
    private func monetaryValues(in line: String, plausibleOnly: Bool = false) -> [Decimal] {
        let cleaned = line
            .replacingOccurrences(of: "$", with: " ")
            .replacingOccurrences(of: "COP", with: " ", options: .caseInsensitive)

        var values: [Decimal] = []
        for raw in cleaned.components(separatedBy: .whitespaces) {
            let token = raw.trimmingCharacters(in: .whitespaces)
            guard !token.isEmpty, token.contains(where: { $0.isNumber }) else { continue }
            // Money tokens are digits + . / , only — this also rejects NITs like "900.123.456-7".
            let nonMoney = token.filter { !$0.isNumber && $0 != "." && $0 != "," }
            guard nonMoney.isEmpty else { continue }

            if plausibleOnly {
                let hasSeparator = token.contains(".") || token.contains(",")
                let digitCount = token.filter { $0.isNumber }.count
                // Long unseparated digit runs are phones / invoice / NIT numbers, not prices.
                if !hasSeparator && digitCount >= 6 { continue }
            }

            guard let value = MoneyParsing.decimal(from: token), value > 0 else { continue }
            if plausibleOnly && value > 50_000_000 { continue } // implausible for a single receipt line
            values.append(value)
        }
        return values
    }

    /// The largest money-like value on a line, so an item count like "2" never beats
    /// the price "45.000" on a "TOTAL 2 ITEMS 45.000"-style line.
    private func largestMonetaryValue(in line: String) -> Decimal? {
        monetaryValues(in: line).max()
    }

    // MARK: - Date extraction

    // Formatters are created once per parse call (cheap enough; avoids static nonisolated(unsafe)).
    private func extractDate(from lines: [String]) -> Date? {
        let formatStrings: [(String, String)] = [
            ("dd/MM/yyyy", "es_CO"),
            ("dd-MM-yyyy", "es_CO"),
            ("yyyy-MM-dd", "en_US_POSIX"),
            ("dd/MM/yy",  "es_CO"),
            ("dd.MM.yyyy", "es_CO"),
            ("MM/dd/yyyy", "en_US_POSIX"),
        ]

        let formatters: [DateFormatter] = formatStrings.map { (fmt, locale) in
            let f = DateFormatter()
            f.dateFormat = fmt
            f.locale = Locale(identifier: locale)
            f.isLenient = false
            return f
        }

        // Also try a Spanish long-form formatter: "15 de marzo de 2024"
        let spanishLong = DateFormatter()
        spanishLong.dateFormat = "d 'de' MMMM 'de' yyyy"
        spanishLong.locale = Locale(identifier: "es_CO")

        let allFormatters = formatters + [spanishLong]

        // Tokenise each line to find date-like sub-strings.
        for line in lines {
            // Try each formatter against the whole line first.
            for fmt in allFormatters {
                // Strip common prefixes like "Fecha:", "Date:", etc.
                let stripped = line
                    .replacingOccurrences(of: "Fecha:", with: "", options: .caseInsensitive)
                    .replacingOccurrences(of: "Fecha :", with: "", options: .caseInsensitive)
                    .replacingOccurrences(of: "Date:", with: "", options: .caseInsensitive)
                    .trimmingCharacters(in: .whitespaces)

                if let d = fmt.date(from: stripped) { return d }
            }

            // Also try space-separated tokens within the line.
            let tokens = line.components(separatedBy: .whitespaces)
            for token in tokens {
                let t = token.trimmingCharacters(in: .punctuationCharacters)
                for fmt in formatters {
                    if let d = fmt.date(from: t) { return d }
                }
            }
        }
        return nil
    }

    // MARK: - Merchant extraction

    private let boilerplatePatterns: [String] = [
        "nit", "factura", "fecha", "total", "subtotal", "iva", "tax",
        "item", "cant", "precio", "valor", "descuento", "referencia",
        "recibo", "ticket", "boleta", "gracias", "caja", "cajero",
        "direccion", "tel", "calle", "carrera", "avenida", "transaccion",
    ]

    private func extractMerchant(from lines: [String]) -> String? {
        for line in lines {
            let t = line.trimmingCharacters(in: .whitespaces)
            guard !t.isEmpty else { continue }

            // Skip lines that are predominantly numeric (amounts, NIT codes, etc.).
            let digitCount = t.filter { $0.isNumber }.count
            let totalCount = t.count
            if totalCount > 0 && Double(digitCount) / Double(totalCount) > 0.5 { continue }

            // Skip lines that are purely punctuation / symbols.
            let letterCount = t.filter { $0.isLetter }.count
            guard letterCount > 0 else { continue }

            // Skip boilerplate keywords.
            let normalised = t.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
            let isBoilerplate = boilerplatePatterns.contains { normalised.contains($0) }
            guard !isBoilerplate else { continue }

            // Skip lines that look like dates (contain "/" or "-" between digits).
            if looksLikeDate(t) { continue }

            // First line that passed all filters is the merchant.
            return t
        }
        return nil
    }

    private func looksLikeDate(_ s: String) -> Bool {
        // Simple heuristic: digit/digit pattern with / or - separator.
        let pattern = #"^\d{1,4}[/\-\.]\d{1,2}[/\-\.]\d{2,4}$"#
        return s.range(of: pattern, options: .regularExpression) != nil
    }
}
