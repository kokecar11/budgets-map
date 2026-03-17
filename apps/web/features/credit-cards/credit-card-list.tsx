"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, CreditCard as CreditCardIcon, CalendarDays, Percent, ChevronRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { CreditCardForm } from "./credit-card-form"
import { creditCardApi } from "./api"
import type { CreditCard } from "./types"

interface CreditCardListProps {
  initialCards: CreditCard[]
}

export function CreditCardList({ initialCards }: CreditCardListProps) {
  const { data: session } = useSession()
  const [cards, setCards] = useState<CreditCard[]>(initialCards)
  const [openForm, setOpenForm] = useState(false)

  function handleCreated(card: CreditCard) {
    setCards((prev) => [card, ...prev])
    setOpenForm(false)
  }

  async function handleDelete(id: string) {
    try {
      await creditCardApi.delete(id, session?.accessToken ?? "")
      setCards((prev) => prev.filter((c) => c.id !== id))
      toast.success("Tarjeta eliminada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar la tarjeta")
    }
  }

  const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 0 })

  const totalLimit = cards.reduce((sum, c) => sum + c.credit_limit, 0)
  const avgRate = cards.length > 0
    ? cards.reduce((sum, c) => sum + c.interest_rate, 0) / cards.length
    : 0

  return (
    <div className="flex flex-col gap-6">

      {/* Header section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Title + button */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <CreditCardIcon className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Tarjetas de Crédito</h1>
              <p className="text-sm text-muted-foreground">Administra todas tus tarjetas</p>
            </div>
          </div>
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            Nueva tarjeta
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Límite total</p>
            <p className="text-3xl font-bold">$ {fmt(totalLimit)}</p>
          </div>
          <div className="px-6 py-5 bg-primary/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">Tarjetas activas</p>
            <p className="text-3xl font-bold text-primary">{cards.length}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Promedio tasa</p>
            <p className="text-3xl font-bold">{avgRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Card list section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <CreditCardIcon className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Todas las Tarjetas</p>
            <p className="text-xs text-muted-foreground">{cards.length} tarjetas registradas</p>
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            No tienes tarjetas de crédito registradas.
          </p>
        ) : (
          <div className="divide-y">
            {cards.map((card) => (
              <div key={card.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                  <CreditCardIcon className="size-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/credit-cards/${card.id}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {card.alias}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                      <CalendarDays className="size-3" />
                      Corte: día {card.cutoff_day}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                      <CalendarDays className="size-3" />
                      Pago: día {card.payment_day}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                      <Percent className="size-3" />
                      Tasa: {card.interest_rate}%
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-base">$ {fmt(card.credit_limit)}</p>
                  <p className="text-xs text-muted-foreground">Límite de crédito</p>
                </div>

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
            ))}
          </div>
        )}
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva tarjeta de crédito</DialogTitle>
            <DialogDescription>Registra una tarjeta con su límite, tasa de interés y fechas de corte.</DialogDescription>
          </DialogHeader>
          <CreditCardForm
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
