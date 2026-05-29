import Foundation

/// Typed failure domain for all API operations.
enum APIError: Error, LocalizedError {
    /// HTTP 401 received after the single reactive refresh retry.
    case unauthorized
    /// Non-401, non-2xx HTTP response.
    case httpError(statusCode: Int)
    /// JSONDecoder failed to decode the response body.
    case decoding(underlying: Error)
    /// URLSession / network-level failure (URLError, etc.).
    case network(underlying: Error)
    /// Could not construct a valid URL from the endpoint path + base URL.
    case invalidURL
    /// No valid access token is available (e.g. called while unauthenticated).
    case missingToken

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Authentication required. Please sign in again."
        case .httpError(let code):
            return "Server returned an error (HTTP \(code))."
        case .decoding(let err):
            return "Response decoding failed: \(err.localizedDescription)"
        case .network(let err):
            return "Network error: \(err.localizedDescription)"
        case .invalidURL:
            return "Could not construct a valid request URL."
        case .missingToken:
            return "No valid authentication token available."
        }
    }
}
