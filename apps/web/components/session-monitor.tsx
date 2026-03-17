"use client"

import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"

export function SessionMonitor() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === "AccessTokenExpired") {
      signOut({ callbackUrl: "/login" })
    }
  }, [session?.error])

  return null
}
