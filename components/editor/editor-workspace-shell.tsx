"use client"

import { UserButton } from "@clerk/nextjs"
import { useState } from "react"
import { Bot, FolderKanban, Sparkles } from "lucide-react"

import { EditorDialogFrame } from "@/components/editor/editor-dialog-frame"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { Button } from "@/components/ui/button"

export function EditorWorkspaceShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <main className="min-h-screen bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        rightSlot={
          <UserButton
            appearance={{
              elements: {
                avatarBox:
                  "size-9 rounded-xl ring-1 ring-[var(--border-default)]",
                userButtonTrigger:
                  "rounded-xl border border-surface-border bg-elevated/80 p-1 transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
              },
            }}
          />
        }
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(100,87,249,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(0,200,212,0.12),transparent_26%)]" />

        <div className="relative flex min-h-[calc(100vh-4rem)] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-elevated/80 px-3 py-1.5 text-sm text-copy-secondary">
              <Sparkles className="h-4 w-4 text-brand" />
              Editor shell foundation
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-elevated/80 px-3 py-1.5 text-sm text-copy-muted">
              <FolderKanban className="h-4 w-4 text-ai-text" />
              Floating sidebar and shared chrome
            </div>
          </section>

          <section className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_24rem]">
            <div className="rounded-3xl border border-surface-border bg-surface/70 p-5 backdrop-blur-sm">
              <div className="flex h-full min-h-[30rem] flex-col rounded-[1.75rem] border border-dashed border-surface-border-subtle bg-base/80 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.2em] text-copy-faint">
                      Canvas staging area
                    </p>
                    <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                      The editor chrome is ready for the collaborative canvas.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-copy-secondary">
                      This surface keeps the main workspace fixed while the
                      project sidebar slides above it, matching the overlay
                      behavior required for future editor chapters.
                    </p>
                  </div>

                  <div className="hidden rounded-2xl border border-surface-border bg-elevated/80 px-4 py-3 text-sm text-copy-muted lg:block">
                    Right-side tools arrive in a later chapter.
                  </div>
                </div>

                <div className="mt-8 grid flex-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-surface-border bg-elevated/75 p-4">
                    <div className="text-sm text-copy-muted">Navbar</div>
                    <div className="mt-2 text-lg font-medium">Left, center, right sections</div>
                  </div>
                  <div className="rounded-2xl border border-surface-border bg-elevated/75 p-4">
                    <div className="text-sm text-copy-muted">Sidebar</div>
                    <div className="mt-2 text-lg font-medium">Slides in without shifting content</div>
                  </div>
                  <div className="rounded-2xl border border-surface-border bg-elevated/75 p-4">
                    <div className="text-sm text-copy-muted">Dialogs</div>
                    <div className="mt-2 text-lg font-medium">Shared surface pattern ready</div>
                  </div>
                </div>
              </div>
            </div>

            <EditorDialogFrame
              title="Dialog Pattern"
              description="Future editor dialogs can reuse this surface, typography, and footer treatment without introducing modal behavior yet."
              footer={
                <>
                  <Button variant="outline" className="rounded-xl">
                    Cancel
                  </Button>
                  <Button className="rounded-xl">
                    <Bot className="h-4 w-4" />
                    Continue
                  </Button>
                </>
              }
            >
              <div className="rounded-2xl border border-surface-border bg-surface/80 p-4 text-sm leading-6 text-copy-secondary">
                The frame supports a title, supporting description, custom body
                content, and footer actions while staying aligned with the
                global token system defined in <code>app/globals.css</code>.
              </div>
            </EditorDialogFrame>
          </section>
        </div>
      </div>
    </main>
  )
}
