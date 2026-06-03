import Vision
import Foundation

/// Runs Vision OCR on a `CGImage` and returns the recognised text lines.
///
/// Intentionally a plain struct with a `nonisolated` method so it can be called
/// from any actor without isolation issues. The Vision work runs on a background
/// thread via a continuation; the result is `[String]` which is Sendable.
///
/// Usage (from any Task, e.g. inside AddTransactionView):
/// ```swift
/// let lines = try await ReceiptScanner().recognizeLines(in: cgImage)
/// let result = ReceiptParser().parse(lines: lines)
/// ```
struct ReceiptScanner {

    /// Recognises text in the provided `CGImage` using Vision.
    ///
    /// - Note: This method deliberately makes **no** assumption about which actor
    ///   it runs on. The blocking `VNImageRequestHandler.perform` call is wrapped
    ///   in a `withCheckedThrowingContinuation` dispatched to a global background
    ///   queue so it never blocks the main thread.
    /// - Returns: Lines of recognised text, ordered top-to-bottom (approximated
    ///   by descending bounding-box `maxY`).
    /// - Throws: Any error produced by `VNImageRequestHandler.perform`.
    nonisolated func recognizeLines(in cgImage: CGImage) async throws -> [String] {
        try await withCheckedThrowingContinuation { continuation in
            // Dispatch to a background queue so the CPU-heavy OCR doesn't touch the main thread.
            DispatchQueue.global(qos: .userInitiated).async {
                let request = VNRecognizeTextRequest()
                request.recognitionLevel       = .accurate
                request.usesLanguageCorrection = true
                request.recognitionLanguages   = ["es-CO", "es", "en"]

                let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
                do {
                    try handler.perform([request])
                } catch {
                    continuation.resume(throwing: error)
                    return
                }

                guard let observations = request.results else {
                    continuation.resume(returning: [])
                    return
                }

                // Sort top-to-bottom: Vision bounding boxes are in normalised
                // coordinates where y = 0 is at the BOTTOM of the image.
                // Sorting by descending maxY gives the reading order from top to bottom.
                let sorted = observations.sorted { $0.boundingBox.maxY > $1.boundingBox.maxY }
                let lines  = sorted.compactMap { $0.topCandidates(1).first?.string }

                continuation.resume(returning: lines)
            }
        }
    }
}
