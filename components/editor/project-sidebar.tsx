"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const emptyStates = [
  {
    value: "my-projects",
    label: "My Projects",
    title: "No projects yet",
    description: "Your owned projects will appear here once the project flow is connected.",
  },
  {
    value: "shared",
    label: "Shared",
    title: "Nothing shared yet",
    description: "Projects shared with you will show up in this tab when collaboration is wired in.",
  },
]

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      className={cn(
        "pointer-events-none fixed top-20 bottom-4 left-4 z-30 w-[min(24rem,calc(100vw-2rem))] transition-all duration-300 ease-out",
        isOpen ? "translate-x-0 opacity-100" : "-translate-x-[calc(100%+1.5rem)] opacity-0"
      )}
      aria-hidden={!isOpen}
    >
      <div className="pointer-events-auto flex h-full flex-col rounded-3xl border border-surface-border bg-surface/92 p-4 shadow-2xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-copy-primary">Projects</h2>
            <p className="text-sm text-copy-muted">
              Workspace navigation will live here.
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl text-copy-secondary hover:text-copy-primary"
            onClick={onClose}
            aria-label="Close project sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs
          defaultValue="my-projects"
          className="mt-4 flex min-h-0 flex-1"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-subtle p-1">
            {emptyStates.map((state) => (
              <TabsTrigger key={state.value} value={state.value}>
                {state.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {emptyStates.map((state) => (
            <TabsContent key={state.value} value={state.value} className="min-h-0 flex-1">
              <div className="flex h-full min-h-52 items-center justify-center rounded-2xl border border-dashed border-surface-border-subtle bg-elevated/70 px-6 text-center">
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-copy-primary">
                    {state.title}
                  </h3>
                  <p className="text-sm leading-6 text-copy-muted">
                    {state.description}
                  </p>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Button className="mt-4 w-full rounded-xl">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  )
}
