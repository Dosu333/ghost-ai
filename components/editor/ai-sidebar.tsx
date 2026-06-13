"use client"

import { useRealtimeRun } from "@trigger.dev/react-hooks"
import {
  Bot,
  Download,
  FileText,
  LoaderCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import {
  ClientSideSuspense,
  useCreateFeed,
  useCreateFeedMessage,
  useEventListener,
  useFeedMessages,
  useRoom,
  useSelf,
} from "@liveblocks/react/suspense"
import {
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  parseAiChatFeedMessage,
  parseAiStatusFeedMessage,
  type AiChatFeedMessage,
  type AiStatusFeedMessage,
} from "@/types/tasks"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: AiChatFeedMessage["role"]
  sender: AiChatFeedMessage["sender"]
  content: string
  timestamp: string
  isCurrentUser: boolean
}

interface AiSidebarContentProps {
  draft: string
  errorMessage: string | null
  isGenerating: boolean
  isOpen: boolean
  isSending: boolean
  latestStatus: AiStatusFeedMessage | null
  messages: ChatMessage[]
  onClose: () => void
  onDraftChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onPromptSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>
  textareaRef: RefObject<HTMLTextAreaElement | null>
}

interface AiSidebarRoomStateProps {
  isOpen: boolean
  onClose: () => void
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

const DEMO_SPEC_SNIPPET =
  "A generated architecture spec will appear here with sections for services, storage, integrations, and delivery notes."

function formatMessageTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function getNewestStatus(
  current: AiStatusFeedMessage | null,
  next: AiStatusFeedMessage | null,
) {
  if (!current) {
    return next
  }

  if (!next) {
    return current
  }

  return new Date(next.timestamp).getTime() >= new Date(current.timestamp).getTime()
    ? next
    : current
}

function AiSidebarContent({
  draft,
  errorMessage,
  isGenerating,
  isOpen,
  isSending,
  latestStatus,
  messages,
  onClose,
  onDraftChange,
  onKeyDown,
  onPromptSubmit,
  textareaRef,
}: AiSidebarContentProps) {
  const statusLabel = isSending
    ? "Sending room message..."
    : isGenerating
      ? "Ghost AI is working"
      : "Collaborate in the AI workspace"

  return (
    <aside
      className={cn(
        "pointer-events-none fixed top-20 right-4 bottom-4 z-30 w-[min(24rem,calc(100vw-2rem))] transition-all duration-300 ease-out",
        isOpen
          ? "translate-x-0 opacity-100"
          : "translate-x-[calc(100%+1.5rem)] opacity-0",
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
              <p className="flex items-center gap-2 text-sm text-copy-muted">
                {isSending || isGenerating ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-ai-text" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-copy-faint" />
                )}
                <span>{statusLabel}</span>
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

          <TabsContent
            value="architect"
            className="mt-4 flex min-h-0 flex-1 flex-col"
          >
            {latestStatus?.text ? (
              <div
                className={cn(
                  "mb-4 rounded-2xl border px-4 py-3 text-sm",
                  latestStatus.status === "error"
                    ? "border-[var(--state-error)] bg-[color:rgba(255,77,79,0.12)] text-copy-primary"
                    : "border-[var(--state-success)] bg-[color:rgba(52,211,153,0.12)] text-copy-primary",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--state-success)] animate-pulse" />
                    <p className="leading-6">{latestStatus.text}</p>
                  </div>
                  <span className="shrink-0 text-[11px] leading-none text-copy-faint">
                    {formatMessageTime(latestStatus.timestamp)}
                  </span>
                </div>
              </div>
            ) : null}

            <ScrollArea className="min-h-0 flex-1 pr-2">
              {messages.length ? (
                <div className="space-y-3 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.isCurrentUser ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                          message.isCurrentUser
                            ? "border-[var(--state-success)] bg-[color:rgba(52,211,153,0.2)] text-copy-primary"
                            : "border border-surface-border bg-elevated text-copy-primary",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] leading-none">
                          <span className="font-semibold text-copy-secondary">
                            {message.sender.name}
                          </span>
                          <span className="text-copy-faint">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                        <div className="mt-2 whitespace-pre-wrap">
                          {message.content}
                        </div>
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
                    Start the room conversation
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-copy-muted">
                    Keep architecture discussion in sync for everyone in the
                    room while Ghost AI status continues separately above.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="rounded-full border border-surface-border bg-subtle px-3 py-2 text-xs font-medium text-ai-text transition-colors hover:border-brand/40 hover:text-copy-primary"
                        onClick={() => onDraftChange(prompt)}
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
              onSubmit={(event) => {
                void onPromptSubmit(event)
              }}
            >
              <Textarea
                ref={textareaRef}
                value={draft}
                disabled={isSending || isGenerating}
                onChange={(event) => onDraftChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Describe the design change you want Ghost AI to make..."
                className="max-h-40 min-h-[72px] resize-none rounded-2xl border-surface-border bg-elevated px-4 py-3 text-sm text-copy-primary placeholder:text-copy-muted focus-visible:border-brand focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-70"
              />
              {errorMessage ? (
                <p className="mt-3 text-xs text-[var(--state-error)]">
                  {errorMessage}
                </p>
              ) : null}
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-copy-muted">
                  Press Enter to send. Use Shift+Enter for a newline.
                </p>
                <Button
                  type="submit"
                  className="rounded-xl bg-[var(--state-success)] px-4 text-copy-primary hover:bg-[color:rgba(52,211,153,0.88)] disabled:bg-[color:rgba(52,211,153,0.28)] disabled:text-copy-muted"
                  disabled={!draft.trim() || isSending || isGenerating}
                >
                  {isSending || isGenerating ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSending ? "Sending..." : isGenerating ? "Designing..." : "Send"}
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

function AiSidebarRoomState(props: AiSidebarRoomStateProps) {
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const room = useRoom()
  const self = useSelf((me) =>
    me
      ? {
          id: me.id,
          info: me.info,
        }
      : null,
  )
  const { messages: statusMessages } = useFeedMessages(AI_STATUS_FEED_ID, {
    limit: 1,
  })
  const { messages: chatFeedMessages } = useFeedMessages(AI_CHAT_FEED_ID)
  const [draft, setDraft] = useState("")
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [activeRunToken, setActiveRunToken] = useState<string | null>(null)
  const [latestEventStatus, setLatestEventStatus] =
    useState<AiStatusFeedMessage | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const handledRunRef = useRef<string | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "72px"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [draft])

  useEventListener(({ event }) => {
    if (event.type !== "ai-status" || event.feedId !== AI_STATUS_FEED_ID) {
      return
    }

    const parsedMessage = parseAiStatusFeedMessage(event.data)

    if (!parsedMessage) {
      return
    }

    setLatestEventStatus((current) => getNewestStatus(current, parsedMessage))
  })

  const latestFeedStatus = useMemo(() => {
    let latestStatus: AiStatusFeedMessage | null = null

    for (const message of statusMessages) {
      latestStatus = getNewestStatus(
        latestStatus,
        parseAiStatusFeedMessage(message.data),
      )
    }

    return latestStatus
  }, [statusMessages])

  const messages = useMemo(() => {
    return chatFeedMessages
      .map((message) => {
        const parsedMessage = parseAiChatFeedMessage(message.data)

        if (!parsedMessage) {
          return null
        }

        return {
          content: parsedMessage.content,
          id: message.id,
          isCurrentUser: parsedMessage.sender.id === self?.id,
          role: parsedMessage.role,
          sender: parsedMessage.sender,
          timestamp: parsedMessage.timestamp,
        } satisfies ChatMessage
      })
      .filter((message) => message !== null)
      .sort(
        (left, right) =>
          new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
      )
  }, [chatFeedMessages, self?.id])

  const latestStatus = getNewestStatus(latestFeedStatus, latestEventStatus)
  const activeStatus =
    latestStatus && latestStatus.runId === activeRunId ? latestStatus : null
  const { run: activeRun, error: activeRunError } = useRealtimeRun(activeRunId ?? undefined, {
    accessToken: activeRunToken ?? undefined,
    enabled: Boolean(activeRunId && activeRunToken),
  })
  const isRunActive =
    activeRunId !== null &&
    !activeRun?.isCompleted &&
    !activeRun?.isFailed &&
    !activeRun?.isCancelled

  async function ensureFeed(feedId: string) {
    try {
      await createFeed(feedId)
    } catch {
      // The feed may already exist for this room.
    }
  }

  async function publishChatMessage(message: AiChatFeedMessage) {
    await ensureFeed(AI_CHAT_FEED_ID)
    await createFeedMessage(AI_CHAT_FEED_ID, message)
  }

  async function publishAssistantMessage(content: string) {
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      return
    }

    await publishChatMessage({
      content: trimmedContent,
      role: "assistant",
      sender: {
        color: self?.info.color,
        id: "ghost-ai",
        name: "Ghost AI",
      },
      timestamp: new Date().toISOString(),
    })
  }

  async function pushChatErrorMessage(content: string) {
    try {
      await publishAssistantMessage(content)
    } catch {
      setSendError(content)
    }
  }

  const handleRealtimeDisconnect = useEffectEvent(() => {
    if (!activeRunId || handledRunRef.current === activeRunId) {
      return
    }

    handledRunRef.current = activeRunId
    void pushChatErrorMessage(
      "Ghost AI lost its realtime connection before the run finished.",
    )
    setActiveRunId(null)
    setActiveRunToken(null)
  })

  const handleRunFinished = useEffectEvent(() => {
    if (!activeRunId || handledRunRef.current === activeRunId || isRunActive) {
      return
    }

    handledRunRef.current = activeRunId

    const finalMessage =
      activeStatus?.text?.trim() ||
      (activeRun?.isCompleted
        ? "Ghost AI finished the latest design update."
        : activeRun?.isCancelled
          ? "Ghost AI stopped before finishing the latest design update."
          : "Ghost AI could not complete the latest design update.")

    void publishAssistantMessage(finalMessage).catch(() => {
      setSendError("Ghost AI finished, but the final room message could not be posted.")
    })

    setActiveRunId(null)
    setActiveRunToken(null)
  })

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const value = draft.trim()

    if (!value || isSending || isRunActive || !self) {
      return
    }

    setIsSending(true)
    setSendError(null)
    handledRunRef.current = null

    try {
      await publishChatMessage({
        content: value,
        role: "user",
        sender: {
          avatar: self.info.avatar,
          color: self.info.color,
          email: self.info.email,
          id: self.id,
          name: self.info.name || self.info.email || "Anonymous collaborator",
        },
        timestamp: new Date().toISOString(),
      })
      setDraft("")

      const enqueueResponse = await fetch("/api/ai/design", {
        body: JSON.stringify({
          projectId: room.id,
          prompt: value,
          roomId: room.id,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })

      const enqueueBody = (await enqueueResponse.json().catch(() => null)) as
        | {
            publicToken?: unknown
            runId?: unknown
            error?: { message?: unknown }
          }
        | null

      if (!enqueueResponse.ok || typeof enqueueBody?.runId !== "string") {
        const message =
          typeof enqueueBody?.error?.message === "string"
            ? enqueueBody.error.message
            : "Ghost AI could not start the design run."

        await pushChatErrorMessage(message)
        return
      }

      setActiveRunId(enqueueBody.runId)

      if (typeof enqueueBody.publicToken === "string") {
        setActiveRunToken(enqueueBody.publicToken)
        return
      }

      const tokenResponse = await fetch("/api/ai/design/token", {
        body: JSON.stringify({
          runId: enqueueBody.runId,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })

      const tokenBody = (await tokenResponse.json().catch(() => null)) as
        | { token?: unknown; error?: { message?: unknown } }
        | null

      if (!tokenResponse.ok || typeof tokenBody?.token !== "string") {
        const message =
          typeof tokenBody?.error?.message === "string"
            ? tokenBody.error.message
            : "Ghost AI could not connect realtime updates for this run."

        await pushChatErrorMessage(message)
        return
      }

      setActiveRunToken(tokenBody.token)
    } catch {
      await pushChatErrorMessage(
        "Ghost AI could not submit that design prompt. Please try again.",
      )
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  useEffect(() => {
    if (!activeRunError) {
      return
    }

    handleRealtimeDisconnect()
  }, [activeRunError, handleRealtimeDisconnect])

  useEffect(() => {
    handleRunFinished()
  }, [activeRun, activeStatus, handleRunFinished])

  return (
    <AiSidebarContent
      {...props}
      draft={draft}
      errorMessage={sendError}
      isGenerating={isRunActive}
      isSending={isSending}
      latestStatus={isRunActive ? activeStatus : null}
      messages={messages}
      onDraftChange={setDraft}
      onKeyDown={handleKeyDown}
      onPromptSubmit={handleSubmit}
      textareaRef={textareaRef}
    />
  )
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <ClientSideSuspense fallback={null}>
      <AiSidebarRoomState isOpen={isOpen} onClose={onClose} />
    </ClientSideSuspense>
  )
}
