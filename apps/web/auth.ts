import { env } from "env"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"


export const { auth, handlers } = NextAuth({
  providers: [
    Credentials({
      id: "confirm",
      credentials: {
        token_hash: {},
        type: {},
      },
      async authorize(credentials) {
        const requestConfirm = await fetch(
          `${process.env.API_URL ?? "http://api:8000"}/api/v1/auth/confirm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token_hash: credentials.token_hash,
              type: credentials.type,
            }),
          }
        )
        if (!requestConfirm.ok) return null
        const res = await requestConfirm.json()
        return {
          id: res.user_id,
          name: res.name,
          email: res.email,
          currency: res.currency,
          plan: res.plan ?? "free",
          access_token: res.access_token,
          refresh_token: res.refresh_token,
        }
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const requestSignIn = await fetch(
          `${process.env.API_URL ?? "http://api:8000"}/api/v1/auth/signin`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          }
        )
        if (!requestSignIn.ok) return null
        const res = await requestSignIn.json()
        return {
          id: res.user_id,
          name: res.name,
          email: res.email,
          currency: res.currency,
          plan: res.plan ?? "free",
          access_token: res.access_token,
          refresh_token: res.refresh_token,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.accessToken = user.access_token
        token.refreshToken = user.refresh_token
        token.userId = user.id
        token.name = user.name
        token.email = user.email
        token.currency = user.currency
        token.plan = user.plan ?? "free"
        // Decode the JWT access token to extract its expiry (exp claim)
        try {
          const b64 = user.access_token!.split(".")[1]!
            .replace(/-/g, "+")
            .replace(/_/g, "/")
          const payload = JSON.parse(atob(b64))
          token.accessTokenExpires = payload.exp * 1000 // convert to ms
        } catch {
          token.accessTokenExpires = Date.now() + 30 * 60 * 1000 // fallback: 30 min
        }
      }
      // Mark as expired so the client can react and sign out
      if (Date.now() > (token.accessTokenExpires ?? Infinity)) {
        token.error = "AccessTokenExpired"
      }
      return token
    },
    session: async ({ session, token }) => {
      session.accessToken = token.accessToken
      session.user.id = token.userId ?? ""
      session.user.name = token.name ?? ""
      session.user.email = token.email ?? ""
      session.user.currency = token.currency ?? ""
      session.user.plan = token.plan ?? "free"
      session.error = token.error
      return session
    },
  },
  secret: env.BETTER_AUTH_SECRET,
})
