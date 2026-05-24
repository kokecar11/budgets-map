"use server"

import { signOut, auth } from "@/auth"

export async function signOutAction(): Promise<void> {
  const session = await auth()

  if (session?.accessToken && session?.refreshToken) {
    try {
      const apiUrl = process.env.API_URL ?? "http://localhost:8000"
      await fetch(`${apiUrl}/api/v1/auth/signout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      })
    } catch {
      // backend unavailable — continue with local sign-out
    }
  }

  await signOut({ redirectTo: "/login" })
}
