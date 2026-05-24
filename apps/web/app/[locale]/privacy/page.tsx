import type { Metadata } from "next"
import Link from "next/link"
import { Eye, Lock, Mail, Shield, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Política de privacidad — Budgets Map",
  description:
    "En Budgets Map nos tomamos en serio la privacidad de tus datos financieros. Conoce qué información recopilamos, cómo la usamos y tus derechos.",
}

const SECTIONS = [
  {
    icon: Eye,
    title: "Datos que recopilamos",
    content: [
      "Información de cuenta: nombre, correo electrónico y preferencias de moneda.",
      "Datos financieros: transacciones, cuentas, presupuestos, metas y préstamos que ingresas manualmente.",
      "Datos de uso: páginas visitadas y acciones realizadas dentro de la aplicación para mejorar la experiencia.",
      "Información de pago: procesada exclusivamente por LemonSqueezy. No almacenamos datos de tarjetas.",
    ],
  },
  {
    icon: Lock,
    title: "Cómo usamos tus datos",
    content: [
      "Proveer y mantener el servicio de gestión financiera personal.",
      "Enviarte reportes y alertas que hayas activado (solo usuarios Pro).",
      "Mejorar las funciones y corregir errores con base en patrones de uso anónimos.",
      "Cumplir con obligaciones legales cuando sea requerido.",
    ],
  },
  {
    icon: Shield,
    title: "Seguridad",
    content: [
      "Tus datos se transmiten cifrados mediante HTTPS/TLS.",
      "Las contraseñas se almacenan con hashing seguro (bcrypt).",
      "Los tokens de acceso tienen expiración automática.",
      "Nunca compartimos ni vendemos tus datos financieros a terceros.",
    ],
  },
  {
    icon: Trash2,
    title: "Eliminación de datos",
    content: [
      "Puedes eliminar tu cuenta en cualquier momento desde Configuración → Cuenta.",
      "Al eliminar tu cuenta, todos tus datos (transacciones, presupuestos, metas, etc.) se borran de forma permanente e irreversible.",
      "Las copias de seguridad se eliminan dentro de los 30 días siguientes.",
    ],
  },
  {
    icon: Mail,
    title: "Contacto",
    content: [
      "Si tienes preguntas sobre esta política o quieres ejercer tus derechos de privacidad, escríbenos a privacidad@budgetsmap.com.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="font-bold text-lg text-primary">Budgets Map</Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">Precios</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">Comenzar gratis</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight">Política de privacidad</h1>
          <p className="text-muted-foreground">
            En <span className="font-medium text-foreground">Budgets Map</span> nos tomamos en serio la privacidad de tus
            datos financieros. Esta política describe qué información recopilamos, cómo la usamos y los derechos que
            tienes sobre ella.
          </p>
          <p className="text-sm text-muted-foreground">Última actualización: marzo 2026</p>
        </div>

        {/* Sections */}
        {SECTIONS.map(({ icon: Icon, title, content }) => (
          <div key={title} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon className="size-5 text-primary" />
              {title}
            </h2>
            <div className="rounded-xl border bg-card px-6 py-5">
              <ul className="flex flex-col gap-2.5">
                {content.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                    <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Budgets Map ·{" "}
        <Link href="/pricing" className="underline underline-offset-2 hover:text-foreground">Precios</Link>
        {" · "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacidad</Link>
        {" · "}
        <Link href="/login" className="underline underline-offset-2 hover:text-foreground">Iniciar sesión</Link>
      </footer>
    </div>
  )
}
