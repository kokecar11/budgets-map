import SwiftUI
import VisionKit

/// A `UIViewControllerRepresentable` that wraps `VNDocumentCameraViewController`.
///
/// VisionKit's document scanner is ideal for receipts: it auto-detects paper
/// edges, deskews, and enhances contrast before handing back a
/// `VNDocumentCameraScan`. We extract page 0 as a `CGImage` on the MainActor
/// (UIImage is not Sendable) and pass it to the off-main-actor OCR pipeline.
///
/// **Physical device only** — `VNDocumentCameraViewController` is unavailable on
/// the Simulator. The app will compile fine on Simulator but must NOT present this
/// view controller there. Gate presentation behind `VNDocumentCameraViewController.isSupported`.
struct DocumentScannerView: UIViewControllerRepresentable {

    /// Called on the MainActor with the scan result AND the raw OCR lines after successful OCR + parsing.
    /// The raw `lines` are passed so callers can escalate to the LLM endpoint without re-running OCR.
    /// `[String]` is `Sendable`; `ReceiptScanResult` is `Sendable` — safe across actor boundaries.
    var onResult: @MainActor (ReceiptScanResult, [String]) -> Void
    /// Called on the MainActor when the user cancels without scanning.
    var onCancel:  @MainActor () -> Void
    /// Called on the MainActor when an error occurs (camera denied, scan failure, etc.).
    var onError:   @MainActor (Error) -> Void

    // MARK: - UIViewControllerRepresentable

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let vc = VNDocumentCameraViewController()
        vc.delegate = context.coordinator
        return vc
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {
        // No dynamic updates needed.
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onResult: onResult, onCancel: onCancel, onError: onError)
    }

    // MARK: - Coordinator

    @MainActor
    final class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {

        private let onResult: @MainActor (ReceiptScanResult, [String]) -> Void
        private let onCancel:  @MainActor () -> Void
        private let onError:   @MainActor (Error) -> Void

        init(
            onResult: @escaping @MainActor (ReceiptScanResult, [String]) -> Void,
            onCancel:  @escaping @MainActor () -> Void,
            onError:   @escaping @MainActor (Error) -> Void
        ) {
            self.onResult = onResult
            self.onCancel = onCancel
            self.onError  = onError
        }

        // MARK: VNDocumentCameraViewControllerDelegate

        nonisolated func documentCameraViewController(
            _ controller: VNDocumentCameraViewController,
            didFinishWith scan: VNDocumentCameraScan
        ) {
            // VisionKit delegate fires on the main thread. Extract the CGImage here
            // (synchronously, on the main thread) so we never capture the non-Sendable
            // VNDocumentCameraScan across an actor boundary — Swift 6 requires this.
            guard scan.pageCount > 0 else {
                Task { @MainActor in onError(ScanError.noPages) }
                return
            }
            // UIImage is not Sendable; extract CGImage immediately on this (main) thread.
            let uiImage = scan.imageOfPage(at: 0)
            guard let cgImage = uiImage.cgImage else {
                Task { @MainActor in onError(ScanError.cgImageUnavailable) }
                return
            }
            // CGImage is safe to pass across actor boundaries (reference-immutable).
            // [String] lines are Sendable — safe to pass to MainActor closure.
            Task { @MainActor in
                // Run OCR off the MainActor (CPU-heavy).
                do {
                    let lines  = try await ReceiptScanner().recognizeLines(in: cgImage)
                    let result = ReceiptParser().parse(lines: lines)
                    onResult(result, lines)
                } catch {
                    onError(error)
                }
            }
        }

        nonisolated func documentCameraViewControllerDidCancel(
            _ controller: VNDocumentCameraViewController
        ) {
            Task { @MainActor in
                onCancel()
            }
        }

        nonisolated func documentCameraViewController(
            _ controller: VNDocumentCameraViewController,
            didFailWithError error: Error
        ) {
            Task { @MainActor in
                onError(error)
            }
        }
    }

    // MARK: - Errors

    enum ScanError: LocalizedError {
        case noPages
        case cgImageUnavailable

        var errorDescription: String? {
            switch self {
            case .noPages:
                return "No pages were captured during the scan."
            case .cgImageUnavailable:
                return "Could not process the scanned image."
            }
        }
    }
}
