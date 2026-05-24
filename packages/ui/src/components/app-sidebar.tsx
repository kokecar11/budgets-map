"use client"

import React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
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
import type { NavUserLabels } from "@workspace/ui/components/nav-user"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  brand: {
    name: string
    tagline: string
  }
  navItems: NavItem[]
  user: {
    name: string
    email: string
    avatar?: string
    plan?: string
  }
  navUserLabels: NavUserLabels
  navUserExtras?: React.ReactNode
}

export function AppSidebar({ brand, navItems, user, navUserLabels, navUserExtras, ...props }: AppSidebarProps) {
  return (
    <TooltipProvider>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div>
                    <Image
                      src="/budgets-map-logo.svg"
                      alt={`${brand.name} logo`}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{brand.name}</span>
                    <span className="truncate text-xs">{brand.tagline}</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navItems} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{ ...user, avatar: user.avatar ?? "" }}
            labels={navUserLabels}
            extras={navUserExtras}
          />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}
