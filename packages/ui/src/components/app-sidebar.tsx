"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

import {
  LayoutDashboard,
  Wallet,
  Tags,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  Landmark,
  CalendarRange,
  Settings,
  BarChart3,
  TrendingUp,
} from "lucide-react"
import dynamic from "next/dynamic"
const NavUser = dynamic(
  () =>
    import("@workspace/ui/components/nav-user").then((m) => ({
      default: m.NavUser,
    })),
  { ssr: false },
)
import { NavMain } from "@workspace/ui/components/nav-main"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import Image from "next/image"

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Cuentas", url: "/accounts", icon: Wallet },
  { title: "Categorías", url: "/categories", icon: Tags },
  { title: "Transacciones", url: "/transactions", icon: ArrowLeftRight },
  { title: "Presupuestos", url: "/budgets", icon: CalendarRange },
  { title: "Metas de ahorro", url: "/savings", icon: PiggyBank },
  { title: "Préstamos", url: "/loans", icon: Landmark },
  { title: "Tarjetas de crédito", url: "/credit-cards", icon: CreditCard },
  { title: "Reportes", url: "/reports", icon: BarChart3 },
  { title: "Patrimonio", url: "/net-worth", icon: TrendingUp },
  // { title: "Configuración", url: "/settings", icon: Settings },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <TooltipProvider>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div>
                    {/* <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"> */}
                    <Image
                      src="/budgets-map-logo.svg"
                      alt="Budgets-map logo"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Budgets Map</span>
                    <span className="truncate text-xs">Financial Solution</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {/* <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>BM</AvatarFallback>
                </Avatar>
                <span className="text-base font-semibold">Budgets Map</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu> */}
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navItems} />
          {/* <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title} className="py-1">
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={{ ...user, avatar: user.avatar ?? "" }} />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}
