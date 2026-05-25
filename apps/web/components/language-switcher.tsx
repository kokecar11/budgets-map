"use client"

import { startTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("languageSwitcher")

  function handleChange(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next as Locale })
    })
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[110px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en" className="text-xs">{t("en")}</SelectItem>
        <SelectItem value="es" className="text-xs">{t("es")}</SelectItem>
      </SelectContent>
    </Select>
  )
}
