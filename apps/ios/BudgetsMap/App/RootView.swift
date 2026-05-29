import SwiftUI

/// Root routing view — observes `SessionStore.state` and switches between:
/// - `.bootstrapping`  → loading splash (prevents Login flash on cold start)
/// - `.unauthenticated` → `LoginView`
/// - `.authenticated`  → `DashboardView`
struct RootView: View {

    private let apiClient: APIClient
    @State private var sessionStore: SessionStore

    init(apiClient: APIClient, sessionStore: SessionStore) {
        self.apiClient = apiClient
        _sessionStore = State(initialValue: sessionStore)
    }

    var body: some View {
        switch sessionStore.state {
        case .bootstrapping:
            splashView

        case .unauthenticated:
            LoginView(sessionStore: sessionStore)
                .transition(.opacity)

        case .authenticated(let session):
            DashboardView(
                apiClient: apiClient,
                sessionStore: sessionStore,
                session: session
            )
            .transition(.opacity)
        }
    }

    // MARK: - Splash

    private var splashView: some View {
        VStack(spacing: 20) {
            Image(systemName: "dollarsign.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(.blue)

            ProgressView()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

#Preview {
    Text("RootView requires a live SessionStore")
}
