import React from "react"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

interface SiteHeaderProps {
  rightSlot?: React.ReactNode
}

export function SiteHeader({ rightSlot }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2" />
        <div className="ml-auto flex items-center gap-2">
          {rightSlot}
        </div>
      </div>
    </header>
  )
}
