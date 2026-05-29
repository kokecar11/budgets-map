"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, CreditCard as CreditCardIcon, CalendarDays, Percent, ChevronRight, Pencil } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useCurrency } from "@/hooks/use-currency"

import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { CreditCardForm } from "./credit-card-form"
import { creditCardApi } from "./api"
import type { CreditCard, CreditCardPeriod, CreditCardTransaction, CreditCardPayment } from "./types"

interface CreditCardListProps {
  initialCards: CreditCard[]
  periodsByCard: Record<string, CreditCardPeriod[]>
  chargesByCard: Record<string, CreditCardTransaction[]>
  paymentsByCard: Record<string, CreditCardPayment[]>
}

function latestPeriod(periods: CreditCardPeriod[]): CreditCardPeriod | null {
  if (!periods.length) return null
  return [...periods].sort(
    (a, b) => new Date(b.period_date).getTime() - new Date(a.period_date).getTime()
  )[0] ?? null
}

export function CreditCardList({ initialCards, periodsByCard, chargesByCard, paymentsByCard }: CreditCardListProps) {
  const { data: session } = useSession()
  const t = useTranslations("creditCards")
  const [cards, setCards] = useState<CreditCard[]>(initialCards)
  const [openForm, setOpenForm] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)

  function handleCreated(card: CreditCard) {
    setCards((prev) => [card, ...prev])
    setOpenForm(false)
  }

  function handleUpdated(card: CreditCard) {
    setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))
    setEditingCard(null)
  }

  async function handleDelete(id: string) {
    try {
      await creditCardApi.delete(id, session?.accessToken ?? "")
      setCards((prev) => prev.filter((c) => c.id !== id))
      toast.success(t("cardDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorDeleting"))
    }
  }

  const fmt = useCurrency()

  const totalLimit = cards.reduce((sum, c) => sum + c.credit_limit, 0)
  const totalDebt = cards.reduce((sum, c) => {
    const charged = (chargesByCard[c.id] ?? []).reduce((s, ch) => s + ch.amount, 0)
    const paid = (paymentsByCard[c.id] ?? []).reduce((s, p) => s + p.amount, 0)
    return sum + Math.max(0, charged - paid)
  }, 0)
  const avgRate = cards.length > 0
    ? cards.reduce((sum, c) => sum + c.interest_rate, 0) / cards.length
    : 0

  return (
    <div className="flex flex-col gap-6">

      {/* Header section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <CreditCardIcon className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            {t("newCard")}
          </Button>
        </div>

        <div className="grid grid-cols-3">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">{t("totalLimit")}</p>
            <p className="text-3xl font-bold">$ {fmt(totalLimit)}</p>
          </div>
          <div className="px-6 py-5 bg-red-500/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-red-600 dark:text-red-500 uppercase mb-2">{t("currentDebt")}</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500">$ {fmt(totalDebt)}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">{t("averageRate")}</p>
            <p className="text-3xl font-bold">{avgRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Card list section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <CreditCardIcon className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{t("allCards")}</p>
            <p className="text-xs text-muted-foreground">{t("countRegistered", { count: cards.length })}</p>
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            {t("noCards")}
          </p>
        ) : (
          <div className="divide-y">
            {cards.map((card) => {
              const charged = (chargesByCard[card.id] ?? []).reduce((s, c) => s + c.amount, 0)
              const paid = (paymentsByCard[card.id] ?? []).reduce((s, p) => s + p.amount, 0)
              const balance = Math.max(0, charged - paid)
              const available = Math.max(0, card.credit_limit - balance)
              const usagePct = card.credit_limit > 0
                ? Math.min(100, (balance / card.credit_limit) * 100)
                : 0
              const usageColor =
                usagePct >= 90 ? "text-red-600 dark:text-red-400" :
                usagePct >= 70 ? "text-yellow-600 dark:text-yellow-400" :
                "text-green-600 dark:text-green-400"
              const progressClass =
                usagePct >= 90 ? "[&>div]:bg-red-500" :
                usagePct >= 70 ? "[&>div]:bg-yellow-400" :
                "[&>div]:bg-green-500"

              return (
                <div key={card.id} className="px-6 py-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                      <CreditCardIcon className="size-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/credit-cards/${card.id}`}
                          className="font-semibold text-sm hover:underline"
                        >
                          {card.alias}
                        </Link>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                          <CalendarDays className="size-3" />
                          {t("cutoffAndPayment", { cutoff: card.cutoff_day, payment: card.payment_day })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                          <Percent className="size-3" />
                          {t("annualRate", { rate: card.interest_rate })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-bold text-base ${usageColor}`}>$ {fmt(balance)}</p>
                      <p className="text-xs text-muted-foreground">{t("ofAmount", { amount: `$ ${fmt(card.credit_limit)}` })}</p>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setEditingCard(card)}
                      title={t("editCard")}
                    >
                      <Pencil className="size-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>

                    <Link href={`/credit-cards/${card.id}`}>
                      <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                    </Link>
                  </div>

                  {/* Usage progress */}
                  <div className="mt-3 pl-14">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{t("used", { pct: usagePct.toFixed(0) })}</span>
                      <span>{t("available", { amount: `$ ${fmt(available)}` })}</span>
                    </div>
                    <Progress value={usagePct} className={`h-1.5 ${progressClass}`} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleNew")}</DialogTitle>
            <DialogDescription>{t("dialogDescNew")}</DialogDescription>
          </DialogHeader>
          <CreditCardForm
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCard)} onOpenChange={(open) => { if (!open) setEditingCard(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleEdit")}</DialogTitle>
            <DialogDescription>{t("dialogDescEdit")}</DialogDescription>
          </DialogHeader>
          {editingCard && (
            <CreditCardForm
              initialValues={editingCard}
              onSuccess={handleUpdated}
              onCancel={() => setEditingCard(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
