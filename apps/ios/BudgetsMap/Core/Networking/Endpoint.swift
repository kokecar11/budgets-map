import Foundation

enum HTTPMethod: String, Sendable {
    case get  = "GET"
    case post = "POST"
}

/// Describes a single API endpoint: path, method, optional Encodable body, auth requirement.
struct Endpoint: Sendable {
    let path: String
    let method: HTTPMethod
    /// Body payload — encoded to JSON by APIClient if present.
    let body: (any Encodable & Sendable)?
    /// When true, APIClient injects `Authorization: Bearer <token>` and handles 401 refresh-retry.
    let requiresAuth: Bool

    init(
        path: String,
        method: HTTPMethod,
        body: (any Encodable & Sendable)? = nil,
        requiresAuth: Bool = false
    ) {
        self.path = path
        self.method = method
        self.body = body
        self.requiresAuth = requiresAuth
    }
}

// MARK: - Factory namespaces

extension Endpoint {
    // MARK: Auth

    static func signin(email: String, password: String) -> Endpoint {
        struct Body: Encodable, Sendable {
            let email: String
            let password: String
        }
        return Endpoint(
            path: "/api/v1/auth/signin",
            method: .post,
            body: Body(email: email, password: password),
            requiresAuth: false
        )
    }

    static func refresh(refreshToken: String) -> Endpoint {
        struct Body: Encodable, Sendable {
            let refresh_token: String
        }
        return Endpoint(
            path: "/api/v1/auth/refresh",
            method: .post,
            body: Body(refresh_token: refreshToken),
            requiresAuth: false
        )
    }

    static func signout(refreshToken: String) -> Endpoint {
        struct Body: Encodable, Sendable {
            let refresh_token: String
        }
        return Endpoint(
            path: "/api/v1/auth/signout",
            method: .post,
            body: Body(refresh_token: refreshToken),
            requiresAuth: true
        )
    }

    // MARK: Dashboard data

    static var transactions: Endpoint {
        Endpoint(path: "/api/v1/transactions", method: .get, requiresAuth: true)
    }

    static var accounts: Endpoint {
        Endpoint(path: "/api/v1/accounts", method: .get, requiresAuth: true)
    }

    static var categories: Endpoint {
        Endpoint(path: "/api/v1/categories", method: .get, requiresAuth: true)
    }
}
