import { notFound } from "next/navigation"
import { setRequestLocale, getMessages } from "next-intl/server"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@workspace/ui/components/sonner"
import { Providers } from "@/components/providers"
import { routing } from "@/i18n/routing"
import type { Metadata } from "next"
import "@workspace/ui/globals.css"

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Budgets Map",
  description: "Budgets Map is a personal finance app.",
  icons: [{ rel: "icon", url: "favicon.ico" }],
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>{children}</Providers>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
