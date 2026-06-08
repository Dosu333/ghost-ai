"use client"

import type { ReactNode } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  rightSlot?: ReactNode
  title?: string
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  rightSlot,
  title = "Editor workspace",
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-surface-border bg-surface/95 backdrop-blur-sm">
      <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-copy-secondary hover:text-copy-primary"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close project sidebar" : "Open project sidebar"}
          >
            <SidebarIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-center">
          <div className="rounded-xl border border-surface-border bg-elevated/80 px-3 py-1.5 text-sm text-copy-secondary">
            {title}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {rightSlot}
        </div>
      </div>
    </header>
  )
}
