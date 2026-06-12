"use client"

import { Bot, Download, FileText, Send, Sparkles, X } from "lucide-react"
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  id: number
  role: "user" | "assistant"
  content: string
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

const DEMO_SPEC_SNIPPET =
  "A generated architecture spec will appear here with sections for services, storage, integrations, and delivery notes."

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "72px"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [draft])

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const value = draft.trim()

    if (!value) {
      return
    }

    const baseId = Date.now()

    setMessages((current) => [
      ...current,
      { id: baseId, role: "user", content: value },
      {
        id: baseId + 1,
        role: "assistant",
        content:
          "Ghost AI workspace UI is ready. Generation actions will connect in the next unit.",
      },
    ])
    setDraft("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <aside
      className={cn(
        "pointer-events-none fixed top-20 right-4 bottom-4 z-30 w-[min(24rem,calc(100vw-2rem))] transition-all duration-300 ease-out",
        isOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+1.5rem)] opacity-0"
      )}
      aria-hidden={!isOpen}
    >
      <div className="pointer-events-auto flex h-full flex-col rounded-3xl border border-surface-border bg-base/95 shadow-2xl shadow-black/20 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3 border-b border-surface-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-ai">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-copy-primary">
                AI Workspace
              </h2>
              <p className="text-sm text-copy-muted">
                Collaborate with Ghost AI
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl text-copy-secondary hover:text-copy-primary"
            onClick={onClose}
            aria-label="Close AI sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs
          defaultValue="architect"
          className="flex min-h-0 flex-1 flex-col px-5 pt-4 pb-5"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-subtle p-1">
            <TabsTrigger
              value="architect"
              className="data-active:bg-accent data-active:text-accent text-copy-muted"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="data-active:bg-accent data-active:text-accent text-copy-muted"
            >
              Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="architect" className="mt-4 flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1 pr-2">
              {messages.length ? (
                <div className="space-y-3 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                          message.role === "user"
                            ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                            : "border border-surface-border bg-elevated text-ai-text"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-ai">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-copy-primary">
                    Start an architecture conversation
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-copy-muted">
                    Prompt Ghost AI to sketch a system direction, then refine it
                    with the team on the canvas.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="rounded-full border border-surface-border bg-subtle px-3 py-2 text-xs font-medium text-ai-text transition-colors hover:border-brand/40 hover:text-copy-primary"
                        onClick={() => setDraft(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>

            <form
              className="mt-4 border-t border-surface-border pt-4"
              onSubmit={handleSubmit}
            >
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the system you want Ghost AI to design..."
                className="max-h-40 min-h-[72px] resize-none rounded-2xl border-surface-border bg-elevated px-4 py-3 text-sm text-copy-primary placeholder:text-copy-muted focus-visible:border-brand focus-visible:ring-brand/30"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-copy-muted">
                  Press Enter to send. Use Shift+Enter for a newline.
                </p>
                <Button
                  type="submit"
                  className="rounded-xl bg-ai px-4 text-copy-primary hover:bg-ai/90"
                  disabled={!draft.trim()}
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="specs" className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-copy-primary">
                  Technical Specs
                </h3>
                <p className="text-sm text-copy-muted">
                  Generate and review project documentation here.
                </p>
              </div>
              <Button className="rounded-xl bg-ai px-4 text-copy-primary hover:bg-ai/90">
                <Sparkles className="h-4 w-4" />
                Generate Spec
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-surface-border bg-elevated p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-base text-ai-text">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-copy-primary">
                      architecture-spec-v1.md
                    </div>
                    <p className="mt-1 text-sm leading-6 text-copy-secondary">
                      {DEMO_SPEC_SNIPPET}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-xl text-copy-muted"
                  disabled
                  aria-label="Download demo spec"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  )
}
