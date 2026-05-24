"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, Landmark, CreditCard, Percent, CalendarDays, ChevronRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useCurrency } from "@/hooks/use-currency"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { LoanForm } from "./loan-form"
import { loanApi } from "./api"
import type { Loan } from "./types"

const STATUS_BADGE: Record<Loan["status"], string> = {
  active: "bg-green-600/10 text-green-600 border-green-600/20 dark:bg-green-500/10 dark:text-green-400",
  paid: "bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400",
  defaulted: "bg-red-600/10 text-red-600 border-red-600/20 dark:bg-red-500/10 dark:text-red-400",
}

interface LoanListProps {
  initialLoans: Loan[]
}

export function LoanList({ initialLoans }: LoanListProps) {
  const { data: session } = useSession()
  const t = useTranslations("loans")
  const [loans, setLoans] = useState<Loan[]>(initialLoans)
  const [openForm, setOpenForm] = useState(false)

  function handleCreated(loan: Loan) {
    setLoans((prev) => [loan, ...prev])
    setOpenForm(false)
  }

  async function handleDelete(id: string) {
    try {
      await loanApi.delete(id, session?.accessToken ?? "")
      setLoans((prev) => prev.filter((l) => l.id !== id))
      toast.success(t("loanDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorDeleting"))
    }
  }

  const fmt = useCurrency()

  const totalDebt = loans.filter((l) => l.status === "active").reduce((sum, l) => sum + l.balance, 0)
  const totalMonthly = loans.filter((l) => l.status === "active").reduce((sum, l) => sum + l.monthly_payment, 0)
  const activeLoans = loans.filter((l) => l.status === "active")

  return (
    <div className="flex flex-col gap-6">

      {/* Header section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Title + button */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <Landmark className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            {t("newLoan")}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5 bg-red-500/5">
            <p className="text-xs font-semibold tracking-widest text-red-600 dark:text-red-500 uppercase mb-2">{t("totalDebt")}</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500">$ {fmt(totalDebt)}</p>
          </div>
          <div className="px-6 py-5 border-x">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">{t("totalMonthly")}</p>
            <p className="text-3xl font-bold">$ {fmt(totalMonthly)}</p>
          </div>
          <div className="px-6 py-5 bg-primary/5">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">{t("activeLoans")}</p>
            <p className="text-3xl font-bold text-primary">{activeLoans.length}</p>
          </div>
        </div>
      </div>

      {/* Loan list section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <Landmark className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{t("allLoans")}</p>
            <p className="text-xs text-muted-foreground">{t("countRegistered", { count: loans.length })}</p>
          </div>
        </div>

        {loans.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            {t("noLoans")}
          </p>
        ) : (
          <div className="divide-y">
            {loans.map((loan) => (
              <div key={loan.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                  <Landmark className="size-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/loans/${loan.id}`} className="font-semibold text-sm hover:underline">
                      {loan.name}
                    </Link>
                    <Badge variant="outline" className="text-xs h-5">{loan.lender}</Badge>
                    <Badge className={`text-xs h-5 ${STATUS_BADGE[loan.status]}`}>
                      {t(`status${loan.status.charAt(0).toUpperCase()}${loan.status.slice(1)}` as "statusActive" | "statusPaid" | "statusDefaulted")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CreditCard className="size-3" />
                      {t("installment")}: $ {fmt(loan.monthly_payment)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Percent className="size-3" />
                      {t("rate")}: {loan.interest_rate}%
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      {t("paymentDay", { day: loan.payment_day })}
                    </span>
                  </div>
                </div>

                <p className="text-base font-bold text-red-500 shrink-0">
                  $ {fmt(loan.balance)}
                </p>

                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(loan.id)}
                >
                  <Trash2 className="size-4" />
                </Button>

                <Link href={`/loans/${loan.id}`}>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleNew")}</DialogTitle>
            <DialogDescription>{t("dialogDescNew")}</DialogDescription>
          </DialogHeader>
          <LoanForm
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
