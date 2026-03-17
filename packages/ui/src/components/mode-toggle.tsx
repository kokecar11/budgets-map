"use client"

import * as React from "react"
// import { IconBrightness } from "@tabler/icons-react"

import { useTheme } from "next-themes"

import { Button } from "@workspace/ui/components/button"
import { SunMoon } from "lucide-react"

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }, [resolvedTheme, setTheme])

  return (
    <Button
      variant="secondary"
      size="icon"
      className="group/toggle size-8 pointer"
      onClick={toggleTheme}
    >
      <SunMoon />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
