import Foundation
import Security

/// Typed errors thrown by KeychainStore operations.
enum KeychainError: Error, LocalizedError {
    case unexpectedStatus(OSStatus)
    case encodingFailure

    var errorDescription: String? {
        switch self {
        case .unexpectedStatus(let status):
            return "Keychain operation failed with OSStatus \(status)"
        case .encodingFailure:
            return "Failed to encode data for Keychain storage"
        }
    }
}

/// Thin wrapper over Security.framework for storing generic-password items.
/// All methods are synchronous — call from any context.
final class KeychainStore: @unchecked Sendable {
    // Service identifier groups all items under a single namespace.
    private let service: String

    init(service: String = "com.budgetsmap.ios") {
        self.service = service
    }

    // MARK: - Write

    /// Stores `data` under `key`, creating or updating the item as needed.
    func set(_ data: Data, forKey key: String) throws {
        let query = baseQuery(for: key)
        let attributes: [CFString: Any] = [kSecValueData: data]

        let addQuery = query.merging([kSecValueData: data] as [CFString: Any]) { _, new in new }
        let addStatus = SecItemAdd(addQuery as CFDictionary, nil)

        if addStatus == errSecSuccess {
            return
        } else if addStatus == errSecDuplicateItem {
            // Item exists — update it.
            let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
            guard updateStatus == errSecSuccess else {
                throw KeychainError.unexpectedStatus(updateStatus)
            }
        } else {
            throw KeychainError.unexpectedStatus(addStatus)
        }
    }

    // MARK: - Read

    /// Returns the stored data for `key`, or `nil` if not found.
    func get(forKey key: String) -> Data? {
        var query = baseQuery(for: key)
        query[kSecReturnData] = kCFBooleanTrue
        query[kSecMatchLimit] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess else { return nil }
        return result as? Data
    }

    // MARK: - Delete

    /// Deletes the item for `key`. Silently ignores `errSecItemNotFound`.
    func delete(forKey key: String) {
        let query = baseQuery(for: key)
        let status = SecItemDelete(query as CFDictionary)
        // errSecItemNotFound is not an error — item was already absent.
        assert(
            status == errSecSuccess || status == errSecItemNotFound,
            "Unexpected Keychain delete status: \(status)"
        )
    }

    // MARK: - Private helpers

    private func baseQuery(for key: String) -> [CFString: Any] {
        [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key
        ]
    }
}
