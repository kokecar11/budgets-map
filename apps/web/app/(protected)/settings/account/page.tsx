"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { toast } from "sonner"
import { LogOut, Trash2, Monitor, Clock } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { apiFetch } from "@/lib/api"

export default function SettingsAccountPage() {
  const { data: session } = useSession()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [deleting, setDeleting] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")

  const emailMatches = confirmEmail === session?.user?.email

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" })
  }

  async function handleDeleteAccount() {
    if (!session?.accessToken || !session?.user?.id) return
    setDeleting(true)
    try {
      await apiFetch(`/api/v1/users/${session.user.id}`, {
        method: "DELETE",
        token: session.accessToken,
      })
      toast.success("Cuenta eliminada")
      await signOut({ callbackUrl: "/login" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar la cuenta")
      setDeleting(false)
    }
  }

  const loginDate = new Date().toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <>
      {/* ── Sesión activa ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">Sesión activa</h2>
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          <div className="flex items-center justify-between px-6 py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <Monitor className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Este dispositivo</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="size-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Sesión iniciada el {loginDate}</p>
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              Activa
            </span>
          </div>
        </div>
      </div>

      {/* ── Cerrar sesión ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">Cerrar sesión</h2>
        <div className="rounded-xl border bg-card px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Cerrar sesión en este dispositivo</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sesión de <span className="font-medium">{session?.user?.email}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* ── Zona de peligro ── */}
      <div>
        <h2 className="text-base font-semibold mb-4 text-destructive">Zona de peligro</h2>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Eliminar cuenta</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acción permanente. Se borrarán todos tus datos y no podrás recuperarlos.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { setConfirmEmail(""); setShowDeleteDialog(true) }}
          >
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!deleting) { setShowDeleteDialog(open); setConfirmEmail("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar cuenta?</DialogTitle>
            <DialogDescription>
              Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todas tus
              transacciones, cuentas, presupuestos y demás datos asociados a tu cuenta.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Escribe <span className="font-medium text-foreground">{session?.user?.email}</span> para confirmar:
            </p>
            <Input
              placeholder={session?.user?.email ?? ""}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={deleting}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || !emailMatches}
            >
              {deleting ? "Eliminando…" : "Eliminar mi cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
