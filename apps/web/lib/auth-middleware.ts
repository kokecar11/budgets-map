import { auth } from "@/auth"
import { NextResponse, type NextRequest } from "next/server"
import { routing } from "@/i18n/routing"

const PROTECTED = [
  "/dashboard",
  "/accounts",
  "/categories",
  "/transactions",
  "/budgets",
  "/savings",
  "/loans",
  "/credit-cards",
  "/reports",
  "/net-worth",
  "/settings",
]

function stripLocale(pathname: string): { locale: string; rest: string } {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return { locale, rest: pathname.slice(`/${locale}`.length) || "/" }
    }
  }
  return { locale: routing.defaultLocale, rest: pathname }
}

export async function withAuth(req: NextRequest, intlRes: Response) {
  const { pathname } = req.nextUrl
  const { locale, rest } = stripLocale(pathname)
  const isProtected = PROTECTED.some(
    (p) => rest === p || rest.startsWith(`${p}/`),
  )

  if (!isProtected) return intlRes

  const session = await auth()
  if (session) return intlRes

  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`
  const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search)
  const loginUrl = new URL(
    `${localePrefix}/login?callbackUrl=${callbackUrl}`,
    req.url,
  )
  return NextResponse.redirect(loginUrl)
}
