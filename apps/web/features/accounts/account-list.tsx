"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, Wallet, Building2, Banknote, Smartphone, Eye, EyeOff } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { AccountForm } from "./account-form"
import { accountApi } from "./api"
import type { Account } from "./types"

const TYPE_LABELS: Record<Account["type"], string> = {
  bank: "Banco",
  cash: "Efectivo",
  digital_wallet: "Cartera digital",
}

const TYPE_ICONS: Record<Account["type"], React.ElementType> = {
  bank: Building2,
  cash: Banknote,
  digital_wallet: Smartphone,
}

interface AccountListProps {
  initialAccounts: Account[]
}

export function AccountList({ initialAccounts }: AccountListProps) {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [openForm, setOpenForm] = useState(false)
  const [hiddenBalances, setHiddenBalances] = useState<Set<string>>(new Set())

  function handleCreated(account: Account) {
    setAccounts((prev) => [account, ...prev])
    setOpenForm(false)
  }

  async function handleDelete(id: string) {
    await accountApi.delete(id, session?.accessToken ?? "")
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  function toggleBalance(id: string) {
    setHiddenBalances((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 0 })

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const activeAccounts = accounts.filter((a) => a.is_active)

  return (
    <div className="flex flex-col gap-6">

      {/* Header section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Title + button */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <Wallet className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Mis Cuentas</h1>
              <p className="text-sm text-muted-foreground">Gestiona tus cuentas bancarias y carteras digitales</p>
            </div>
          </div>
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            Nueva cuenta
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Balance total</p>
            <p className="text-3xl font-bold">$ {fmt(totalBalance)}</p>
          </div>
          <div className="px-6 py-5 bg-primary/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">Cuentas activas</p>
            <p className="text-3xl font-bold text-primary">{activeAccounts.length}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">Total cuentas</p>
            <p className="text-3xl font-bold">{accounts.length}</p>
          </div>
        </div>
      </div>

      {/* Account list section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            <Wallet className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Todas las Cuentas</p>
            <p className="text-xs text-muted-foreground">{accounts.length} cuentas registradas</p>
          </div>
        </div>

        {accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            No tienes cuentas. Agrega una para empezar.
          </p>
        ) : (
          <div className="divide-y">
            {accounts.map((account) => {
              const Icon = TYPE_ICONS[account.type]
              const hidden = hiddenBalances.has(account.id)
              return (
                <div key={account.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{account.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs h-5">
                        {TYPE_LABELS[account.type]}
                      </Badge>
                      {account.is_active && (
                        <Badge className="text-xs h-5 bg-green-600/10 text-green-600 border-green-600/20 dark:bg-green-500/10 dark:text-green-400">
                          Activa
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-base shrink-0">
                    {hidden ? "$ •••••" : `$ ${fmt(account.balance)}`}
                  </p>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground shrink-0"
                    onClick={() => toggleBalance(account.id)}
                  >
                    {hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta</DialogTitle>
            <DialogDescription>Configura el nombre, tipo y saldo inicial de la cuenta.</DialogDescription>
          </DialogHeader>
          <AccountForm
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
