import Foundation

/// Reads build-time configuration from Info.plist (sourced from xcconfig per build configuration).
/// Crashes early with a clear message if a required key is missing — config bugs must never ship silently.
final class AppConfig: @unchecked Sendable {
    static let shared = AppConfig()

    let baseURL: URL

    private init() {
        guard
            let raw = Bundle.main.infoDictionary?["API_BASE_URL"] as? String,
            !raw.isEmpty,
            let url = URL(string: raw)
        else {
            fatalError(
                """
                API_BASE_URL is missing or invalid in Info.plist. \
                Check that the xcconfig for the active build configuration sets this key \
                and that Info.plist contains: <key>API_BASE_URL</key><string>$(API_BASE_URL)</string>
                """
            )
        }
        baseURL = url
    }
}
