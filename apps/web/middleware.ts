import createMiddleware from "next-intl/middleware"
import type { NextRequest } from "next/server"
import { routing } from "./i18n/routing"
import { withAuth } from "./lib/auth-middleware"

const intlMiddleware = createMiddleware(routing)

export default async function middleware(req: NextRequest) {
  const intlResponse = intlMiddleware(req)
  return withAuth(req, intlResponse)
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}
