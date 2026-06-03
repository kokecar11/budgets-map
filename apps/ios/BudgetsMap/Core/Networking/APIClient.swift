import Foundation

/// Contract that SessionStore fulfils so APIClient can obtain a valid bearer token
/// and trigger a forced refresh on 401, without a direct circular dependency.
protocol TokenProviding: AnyObject, Sendable {
    /// Returns a valid access token, proactively refreshing if near expiry.
    func validAccessToken() async throws -> String
    /// Forces a refresh regardless of expiry (called on reactive 401 path).
    func forceRefresh() async throws
}

/// Stateless HTTP client built on URLSession.
/// - Composes requests from `Endpoint` descriptors.
/// - Injects `Authorization: Bearer` on auth'd endpoints.
/// - Retries once on 401 after calling `tokenProvider.forceRefresh()`.
final class APIClient: Sendable {
    private let baseURL: URL
    private let session: URLSession
    // Weak-style via protocol to avoid retain cycle with SessionStore.
    private let tokenProvider: any TokenProviding

    init(baseURL: URL, session: URLSession = .shared, tokenProvider: any TokenProviding) {
        self.baseURL = baseURL
        self.session = session
        self.tokenProvider = tokenProvider
    }

    // MARK: - Public API

    /// Executes `endpoint` and decodes the response body as `T`.
    func request<T: Decodable & Sendable>(_ endpoint: Endpoint) async throws -> T {
        let data = try await execute(endpoint, isRetry: false)
        do {
            return try JSONCoding.decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding(underlying: error)
        }
    }

    /// Executes `endpoint` and discards the response body (e.g. signout).
    func send(_ endpoint: Endpoint) async throws {
        _ = try await execute(endpoint, isRetry: false)
    }

    /// POSTs a new transaction and returns the server-created `Transaction`.
    /// Reuses the generic `request` path — Bearer injection + 401 retry included.
    func createTransaction(_ body: TransactionCreateRequest) async throws -> Transaction {
        try await request(Endpoint.createTransaction(body))
    }

    /// Sends OCR text lines to the LLM receipt-scan endpoint and returns a `ReceiptScanResult`.
    ///
    /// Throws `APIError.httpError(statusCode: 403)` when the user is not PRO,
    /// `APIError.httpError(statusCode: 429)` when the monthly scan limit is reached,
    /// and `APIError.httpError(statusCode: 502)` / `504` on OpenAI backend failure.
    /// All other `APIError` cases propagate normally.
    func scanReceiptText(lines: [String]) async throws -> ReceiptScanResult {
        let dto: ReceiptScanResponseDTO = try await request(Endpoint.scanReceiptText(lines: lines))
        return dto.toResult()
    }

    // MARK: - Private execution

    private func execute(_ endpoint: Endpoint, isRetry: Bool) async throws -> Data {
        let urlRequest = try await buildRequest(endpoint)

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch let urlError as URLError {
            throw APIError.network(underlying: urlError)
        } catch {
            throw APIError.network(underlying: error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.network(underlying: URLError(.badServerResponse))
        }

        switch http.statusCode {
        case 200..<300:
            return data

        case 401 where endpoint.requiresAuth && !isRetry:
            // Reactive refresh — one attempt only.
            try await tokenProvider.forceRefresh()
            return try await execute(endpoint, isRetry: true)

        case 401:
            throw APIError.unauthorized

        default:
            throw APIError.httpError(statusCode: http.statusCode)
        }
    }

    private func buildRequest(_ endpoint: Endpoint) async throws -> URLRequest {
        guard let url = URL(string: endpoint.path, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue

        if let body = endpoint.body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do {
                request.httpBody = try JSONCoding.encoder.encode(body)
            } catch {
                throw APIError.decoding(underlying: error)
            }
        }

        if endpoint.requiresAuth {
            let token = try await tokenProvider.validAccessToken()
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        return request
    }
}
