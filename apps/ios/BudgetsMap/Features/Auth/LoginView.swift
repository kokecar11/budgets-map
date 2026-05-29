import SwiftUI

/// Login screen — email + password form with validation, loading, and error display.
struct LoginView: View {

    @State private var viewModel: LoginViewModel

    init(sessionStore: SessionStore) {
        _viewModel = State(initialValue: LoginViewModel(sessionStore: sessionStore))
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                // MARK: - Header
                VStack(spacing: 8) {
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(.blue)

                    Text("BudgetsMap")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Sign in to your account")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                // MARK: - Fields
                VStack(spacing: 16) {
                    TextField("Email", text: $viewModel.email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .autocorrectionDisabled()
                        .padding()
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))

                    SecureField("Password", text: $viewModel.password)
                        .textContentType(.password)
                        .padding()
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                }

                // MARK: - Error message
                if let message = viewModel.errorMessage {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .foregroundStyle(.red)
                        Text(message)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                    .padding(.horizontal)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }

                // MARK: - Sign In button
                Button {
                    Task { await viewModel.submit() }
                } label: {
                    HStack(spacing: 8) {
                        if viewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.85)
                        }
                        Text(viewModel.isLoading ? "Signing in…" : "Sign In")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        (viewModel.isValid && !viewModel.isLoading) ? Color.blue : Color.gray,
                        in: RoundedRectangle(cornerRadius: 12)
                    )
                    .foregroundStyle(.white)
                }
                .disabled(!viewModel.isValid || viewModel.isLoading)
                .animation(.easeInOut(duration: 0.2), value: viewModel.isLoading)

                Spacer()
            }
            .padding(.horizontal, 24)
            .animation(.easeInOut(duration: 0.2), value: viewModel.errorMessage)
            .navigationTitle("")
            .navigationBarHidden(true)
        }
    }
}

#Preview {
    // Preview with a stub — won't compile against a live SessionStore,
    // but satisfies Xcode preview rendering.
    Text("LoginView Preview — requires live SessionStore")
}
