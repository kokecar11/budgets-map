import { Shield, Lock, Eye, Trash2, Mail } from "lucide-react"

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
    <>
      {/* ── Introducción ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">Política de privacidad</h2>
        <div className="rounded-xl border bg-card px-6 py-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            En <span className="font-medium text-foreground">Budgets Map</span> nos tomamos en serio la privacidad de tus
            datos financieros. Esta política describe qué información recopilamos, cómo la usamos y los derechos que
            tienes sobre ella. Última actualización:{" "}
            <span className="font-medium text-foreground">marzo 2025</span>.
          </p>
        </div>
      </div>

      {/* ── Secciones ── */}
      {SECTIONS.map(({ icon: Icon, title, content }) => (
        <div key={title}>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
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
    </>
  )
}
