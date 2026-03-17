import { env } from "env"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"


export const { auth, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const requestSignIn = await fetch(
          `http://api:8000/api/v1/auth/signin`,
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
        const responseSignIn = await requestSignIn.json()
        console.log("responseSignIn:",responseSignIn)
        const requestMe = await fetch(
          `http://api:8000/api/v1/auth/me`,
          {
            method: "GET",
            headers: { 
              "Content-Type": "application/json", 
              "Authorization": `Bearer ${responseSignIn.access_token}` 
            },
          }
        )
        if (!requestMe.ok) return null
        const responseMe = await requestMe.json()
        console.log("responseMe:",responseMe)
        return {
          id: responseMe.id,
          name: responseMe.name,
          email: responseMe.email,
          currency: responseMe.currency,
          plan: responseMe.plan ?? "free",
          access_token: responseSignIn.access_token,
          refresh_token: responseSignIn.refresh_token,
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
