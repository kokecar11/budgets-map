import Foundation

/// Serializes and deserializes a `Session` to/from a single Keychain item.
/// Intentionally throws on save errors (caller must handle) and returns nil on any load error.
final class SessionPersistence: @unchecked Sendable {
    private let store: KeychainStore
    private let key = "session"

    init(store: KeychainStore = KeychainStore()) {
        self.store = store
    }

    // MARK: - Save

    func save(_ session: Session) throws {
        let data = try JSONEncoder().encode(session)
        try store.set(data, forKey: key)
    }

    // MARK: - Load

    /// Returns the persisted session, or `nil` on absence or decode failure.
    /// On decode failure, stale data is cleared to prevent repeated decode errors.
    func load() -> Session? {
        guard let data = store.get(forKey: key) else { return nil }
        do {
            return try JSONDecoder().decode(Session.self, from: data)
        } catch {
            // Stale / corrupt data — clear it so the user lands on Login cleanly.
            store.delete(forKey: key)
            return nil
        }
    }

    // MARK: - Clear

    func clear() {
        store.delete(forKey: key)
    }
}
