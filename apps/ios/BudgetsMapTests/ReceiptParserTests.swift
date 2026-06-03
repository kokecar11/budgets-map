import XCTest
@testable import BudgetsMap

final class ReceiptParserTests: XCTestCase {

    private let parser = ReceiptParser()

    // MARK: - Amount: total keyword wins over other monetary values

    func test_totalKeyword_winsOverOtherMonetaryValues() {
        let lines = [
            "SUPERMERCADO XYZ",
            "Arroz 2.500",
            "Leche 3.800",
            "SUBTOTAL 6.300",
            "TOTAL 6.300",
        ]
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(6300))
    }

    // MARK: - Amount: largest-value fallback (no keyword)

    func test_noKeyword_fallsBackToLargestValue() {
        let lines = [
            "TIENDA",
            "Item A 1.200",
            "Item B 4.900",
            "Item C 800",
        ]
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(4900))
    }

    // MARK: - Invoice-aware: subtotal / IVA must NOT win

    func test_subtotalAndIVA_notPicked_grandTotalWins() {
        let lines = [
            "ALMACEN LA 14",
            "SUBTOTAL        40.000",
            "IVA 19%          7.600",
            "TOTAL A PAGAR   47.600",
        ]
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(47600))
    }

    func test_efectivoAndCambio_neverWin() {
        let lines = [
            "RESTAURANTE EL FOGON",
            "SUBTOTAL   50.000",
            "IVA         9.500",
            "TOTAL      59.500",
            "EFECTIVO   60.000",
            "CAMBIO        500",
        ]
        // 59.500 must win over the larger EFECTIVO 60.000 (cash given).
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(59500))
    }

    func test_ivaIncluido_isTreatedAsTotal() {
        let lines = [
            "CAFE CENTRAL",
            "CONSUMO              30.000",
            "TOTAL IVA INCLUIDO   35.700",
        ]
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(35700))
    }

    // MARK: - Invoice-aware: tier priority

    func test_totalAPagar_beatsBareTotal() {
        let lines = [
            "DROGUERIA",
            "TOTAL          40.000",
            "TOTAL A PAGAR  47.600",
        ]
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(47600))
    }

    func test_itemCountLine_doesNotBecomeAmount() {
        let lines = [
            "TIENDA D1",
            "TOTAL UNIDADES 12",
            "45.000",
        ]
        // "TOTAL UNIDADES 12" is a component line (count), so the real amount
        // comes from the plain "45.000" fallback line.
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(45000))
    }

    // MARK: - Invoice-aware: NIT / phone not mistaken for amounts (fallback)

    func test_nitAndPhone_notPickedInFallback() {
        let lines = [
            "EMPRESA SAS",
            "NIT 900.123.456-7",
            "TEL 3001234567",
            "PRODUCTO 15.000",
        ]
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(15000))
    }

    // MARK: - Amount on the next line

    func test_amountOnNextLine_afterLabel() {
        let lines = [
            "TOTAL A PAGAR",
            "$ 18.500",
        ]
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(18500))
    }

    func test_singleTotalLine_extractsAmount() {
        let lines = ["TOTAL A PAGAR: $ 25.900"]
        XCTAssertEqual(parser.parse(lines: lines).amount, Decimal(25900))
    }

    // MARK: - Date parsing

    func test_parsesSlashDate_ddMMyyyy() {
        let lines = ["Fecha: 15/03/2024", "TOTAL 10.000"]
        var comps = DateComponents()
        comps.year = 2024; comps.month = 3; comps.day = 15
        let expected = Calendar(identifier: .gregorian).date(from: comps)!
        XCTAssertEqual(
            Calendar.current.startOfDay(for: parser.parse(lines: lines).date ?? .distantPast),
            Calendar.current.startOfDay(for: expected)
        )
    }

    // MARK: - Merchant extraction

    func test_merchant_isFirstSubstantiveLine() {
        let lines = [
            "PANADERIA LA ESPIGA",
            "NIT 900.123.456-7",
            "Fecha 01/01/2024",
            "TOTAL 5.000",
        ]
        XCTAssertEqual(parser.parse(lines: lines).merchant, "PANADERIA LA ESPIGA")
    }

    // MARK: - Robustness

    func test_emptyInput_returnsAllNils() {
        let result = parser.parse(lines: [])
        XCTAssertNil(result.amount)
        XCTAssertNil(result.date)
        XCTAssertNil(result.merchant)
        XCTAssertNil(result.currency)
    }

    func test_garbageInput_doesNotCrash() {
        let lines = ["!@#$%", "   ", "xyz", "....", ",,,,"]
        XCTAssertNil(parser.parse(lines: lines).amount)
    }
}
