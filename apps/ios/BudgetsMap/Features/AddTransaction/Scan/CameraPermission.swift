import AVFoundation

/// Helpers for checking and requesting camera access.
///
/// The scan flow calls `ensureAccess()` before presenting
/// `DocumentScannerView`. If `false` is returned the View shows
/// a graceful denial message — manual entry always remains usable.
enum CameraPermission {

    /// Returns `true` when the app has (or obtains) camera access.
    ///
    /// - `.authorized`       → returns `true` immediately.
    /// - `.notDetermined`    → requests access from the system and returns
    ///                         the user's choice.
    /// - `.denied`/`.restricted` → returns `false` (no dialog shown again).
    static func ensureAccess() async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            return true
        case .notDetermined:
            return await AVCaptureDevice.requestAccess(for: .video)
        case .denied, .restricted:
            return false
        @unknown default:
            return false
        }
    }
}
