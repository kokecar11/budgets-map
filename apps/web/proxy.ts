export { auth as proxy } from "@/auth"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/categories/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/savings/:path*",
    "/loans/:path*",
    "/credit-cards/:path*",
  ],
}
