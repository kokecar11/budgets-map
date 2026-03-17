import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import "@workspace/ui/globals.css"
import { auth } from "@/auth"
import { AppSidebar } from "@workspace/ui/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { SiteHeader } from "@workspace/ui/components/site-header"
import { SessionMonitor } from "@/components/session-monitor"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()])

  if (!session) {
    redirect("/login")
  }
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        user={{
          name: session?.user.name ?? "",
          email: session?.user.email ?? "",
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
      <SessionMonitor />
    </SidebarProvider>
  )
}
