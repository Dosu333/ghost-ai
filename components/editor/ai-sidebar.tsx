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
  useStorage,
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

import { EditorDialogFrame } from "@/components/editor/editor-dialog-frame"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { parseCanvasSnapshot } from "@/lib/canvas-persistence"
import { renderMarkdownToHtml } from "@/lib/markdown"
import { cn } from "@/lib/utils"
import type { CanvasSnapshot } from "@/types/canvas-persistence"
import type {
  ProjectSpecContent,
  ProjectSpecContentResponse,
  ProjectSpecListItem,
  ProjectSpecsListResponse,
} from "@/types/project-specs"
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
  activeTab: "architect" | "specs"
  draft: string
  errorMessage: string | null
  isGenerating: boolean
  isOpen: boolean
  isSending: boolean
  latestStatus: AiStatusFeedMessage | null
  messages: ChatMessage[]
  onClose: () => void
  onDraftChange: (value: string) => void
  onGenerateSpec: () => Promise<void>
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onPromptSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>
  onSpecDownload: (specId: string) => void
  onSpecPreviewChange: (specId: string | null) => void
  onTabChange: (value: "architect" | "specs") => void
  specGenerationError: string | null
  specGenerationStatus: AiStatusFeedMessage | null
  isSpecGenerating: boolean
  previewError: string | null
  previewSpec: ProjectSpecContent | null
  selectedSpecId: string | null
  specs: ProjectSpecListItem[]
  specsError: string | null
  specsLoading: boolean
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

function formatMessageTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatSpecDate(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function buildCanvasSnapshotFromFlow(value: unknown): CanvasSnapshot {
  if (!isRecord(value)) {
    return {
      edges: [],
      nodes: [],
    }
  }

  const nodesRecord = isRecord(value.nodes) ? value.nodes : {}
  const edgesRecord = isRecord(value.edges) ? value.edges : {}

  return (
    parseCanvasSnapshot({
      edges: Object.values(edgesRecord),
      nodes: Object.values(nodesRecord),
    }) ?? {
      edges: [],
      nodes: [],
    }
  )
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

function downloadProjectSpec(projectId: string, specId: string) {
  if (typeof document === "undefined") {
    return
  }

  const anchor = document.createElement("a")
  anchor.href = `/api/projects/${projectId}/specs/${specId}/download`
  anchor.rel = "noreferrer"
  anchor.style.display = "none"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function AiSidebarContent({
  activeTab,
  draft,
  errorMessage,
  isGenerating,
  isOpen,
  isSending,
  latestStatus,
  messages,
  onClose,
  onDraftChange,
  onGenerateSpec,
  onKeyDown,
  onPromptSubmit,
  onSpecDownload,
  onSpecPreviewChange,
  onTabChange,
  specGenerationError,
  specGenerationStatus,
  isSpecGenerating,
  previewError,
  previewSpec,
  selectedSpecId,
  specs,
  specsError,
  specsLoading,
  textareaRef,
}: AiSidebarContentProps) {
  const statusLabel = isSending
    ? "Sending room message..."
    : isGenerating
      ? "Ghost AI is working"
      : "Collaborate in the AI workspace"
  const renderedSpecPreview = useMemo(() => {
    if (!previewSpec?.markdown) {
      return ""
    }

    return renderMarkdownToHtml(previewSpec.markdown)
  }, [previewSpec?.markdown])

  return (
    <>
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
            value={activeTab}
            onValueChange={(value) => onTabChange(value as "architect" | "specs")}
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
                <Button
                  type="button"
                  className="rounded-xl bg-ai px-4 text-copy-primary hover:bg-ai/90"
                  onClick={() => {
                    void onGenerateSpec()
                  }}
                  disabled={isSpecGenerating}
                >
                  {isSpecGenerating ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isSpecGenerating ? "Generating..." : "Generate Spec"}
                </Button>
              </div>

              {specGenerationStatus?.text ? (
                <div
                  className={cn(
                    "mt-4 rounded-2xl border px-4 py-3 text-sm",
                    specGenerationStatus.status === "error"
                      ? "border-[var(--state-error)] bg-[color:rgba(255,77,79,0.12)] text-copy-primary"
                      : specGenerationStatus.status === "complete"
                        ? "border-[var(--state-success)] bg-[color:rgba(52,211,153,0.12)] text-copy-primary"
                        : "border-brand/40 bg-accent-dim text-copy-primary",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      {specGenerationStatus.status === "error" ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--state-error)]" />
                      ) : specGenerationStatus.status === "complete" ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--state-success)]" />
                      ) : (
                        <LoaderCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-ai-text" />
                      )}
                      <p className="leading-6">{specGenerationStatus.text}</p>
                    </div>
                    <span className="shrink-0 text-[11px] leading-none text-copy-faint">
                      {formatMessageTime(specGenerationStatus.timestamp)}
                    </span>
                  </div>
                </div>
              ) : null}

              {specGenerationError ? (
                <div className="mt-4 rounded-2xl border border-[var(--state-error)] bg-[color:rgba(255,77,79,0.12)] px-4 py-3 text-sm text-copy-primary">
                  {specGenerationError}
                </div>
              ) : null}

              <div className="mt-4 min-h-0 flex-1 rounded-2xl border border-surface-border bg-elevated">
                <ScrollArea className="h-full">
                  <div className="space-y-2 p-3">
                    {specsLoading ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-surface-border bg-base/70 px-4 py-3 text-sm text-copy-muted">
                        <LoaderCircle className="h-4 w-4 animate-spin text-ai-text" />
                        Loading specs...
                      </div>
                    ) : specsError ? (
                      <div className="rounded-2xl border border-[var(--state-error)] bg-[color:rgba(255,77,79,0.12)] px-4 py-3 text-sm text-copy-primary">
                        {specsError}
                      </div>
                    ) : specs.length ? (
                      specs.map((spec) => (
                        <div
                          key={spec.id}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border border-surface-border bg-base/70 p-2 transition-colors hover:border-brand/40 hover:bg-subtle/80",
                            selectedSpecId === spec.id &&
                              "border-brand/40 bg-subtle/80",
                          )}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-start gap-3 rounded-xl px-2 py-2 text-left"
                            onClick={() => onSpecPreviewChange(spec.id)}
                          >
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-elevated text-ai-text">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-copy-primary">
                                {spec.fileName}
                              </div>
                              <p className="mt-1 text-xs text-copy-muted">
                                {formatSpecDate(spec.createdAt)}
                              </p>
                            </div>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 rounded-xl text-copy-muted hover:text-copy-primary"
                            onClick={() => onSpecDownload(spec.id)}
                            aria-label={`Download ${spec.fileName}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="flex min-h-56 flex-col items-center justify-center px-4 py-8 text-center">
                        <div className="flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-base text-ai-text">
                          <FileText className="h-6 w-6" />
                        </div>
                        <h4 className="mt-4 text-sm font-semibold text-copy-primary">
                          No specs yet
                        </h4>
                        <p className="mt-2 max-w-xs text-sm leading-6 text-copy-muted">
                          Generated project specs will appear here once they have
                          been saved.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </aside>

      <Dialog
        open={selectedSpecId !== null}
        onOpenChange={(open) => {
          if (!open) {
            onSpecPreviewChange(null)
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">Spec Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Preview the selected project spec and download it as Markdown.
          </DialogDescription>
          <EditorDialogFrame
            title={previewSpec?.fileName ?? "Spec Preview"}
            description={
              previewSpec
                ? `Generated ${formatSpecDate(previewSpec.createdAt)}`
                : "Loading the selected project spec."
            }
            className="flex max-h-[85vh] flex-col"
            contentClassName="min-h-0 flex-1"
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => onSpecPreviewChange(null)}
                >
                  Close
                </Button>
                {previewSpec ? (
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={() => onSpecDownload(previewSpec.id)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                ) : null}
              </>
            }
          >
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-surface-border bg-surface/70">
              <ScrollArea className="min-h-0 flex-1">
                {previewError ? (
                  <div className="px-5 py-4 text-sm text-[var(--state-error)]">
                    {previewError}
                  </div>
                ) : previewSpec ? (
                  <div
                    className={cn(
                      "px-5 py-4 text-sm leading-7 text-copy-secondary",
                      "[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4",
                      "[&_blockquote]:border-l-2 [&_blockquote]:border-surface-border [&_blockquote]:pl-4 [&_blockquote]:text-copy-muted",
                      "[&_code]:rounded-md [&_code]:bg-base [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-copy-primary",
                      "[&_em]:text-copy-primary [&_h1]:mt-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-copy-primary",
                      "[&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-copy-primary",
                      "[&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-copy-primary",
                      "[&_hr]:my-6 [&_hr]:border-surface-border",
                      "[&_li]:text-copy-secondary [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2",
                      "[&_p]:mt-3 [&_p:first-child]:mt-0 [&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-surface-border [&_pre]:bg-base [&_pre]:p-4",
                      "[&_strong]:font-semibold [&_strong]:text-copy-primary [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2",
                    )}
                    dangerouslySetInnerHTML={{
                      __html: renderedSpecPreview,
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2 px-5 py-4 text-sm text-copy-muted">
                    <LoaderCircle className="h-4 w-4 animate-spin text-ai-text" />
                    Loading spec preview...
                  </div>
                )}
              </ScrollArea>
            </div>
          </EditorDialogFrame>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AiSidebarRoomState(props: AiSidebarRoomStateProps) {
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const room = useRoom()
  const roomFlow = useStorage((storage) => storage.flow ?? null)
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
  const [activeTab, setActiveTab] = useState<"architect" | "specs">("architect")
  const [designRunId, setDesignRunId] = useState<string | null>(null)
  const [designRunToken, setDesignRunToken] = useState<string | null>(null)
  const [specRunId, setSpecRunId] = useState<string | null>(null)
  const [specRunToken, setSpecRunToken] = useState<string | null>(null)
  const [latestDesignEventStatus, setLatestDesignEventStatus] =
    useState<AiStatusFeedMessage | null>(null)
  const [latestSpecEventStatus, setLatestSpecEventStatus] =
    useState<AiStatusFeedMessage | null>(null)
  const [specs, setSpecs] = useState<ProjectSpecListItem[]>([])
  const [specsError, setSpecsError] = useState<string | null>(null)
  const [specsLoading, setSpecsLoading] = useState(false)
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null)
  const [previewSpec, setPreviewSpec] = useState<ProjectSpecContent | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [specGenerationError, setSpecGenerationError] = useState<string | null>(null)
  const [isSpecRequestPending, setIsSpecRequestPending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const handledDesignRunRef = useRef<string | null>(null)
  const handledSpecRunRef = useRef<string | null>(null)
  const canvasSnapshot = useMemo(
    () => buildCanvasSnapshotFromFlow(roomFlow),
    [roomFlow],
  )

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

    if (parsedMessage.scope === "spec") {
      setLatestSpecEventStatus((current) => getNewestStatus(current, parsedMessage))
      return
    }

    setLatestDesignEventStatus((current) =>
      getNewestStatus(current, parsedMessage),
    )
  })

  const latestDesignFeedStatus = useMemo(() => {
    let latestStatus: AiStatusFeedMessage | null = null

    for (const message of statusMessages) {
      const parsedMessage = parseAiStatusFeedMessage(message.data)

      if (!parsedMessage || parsedMessage.scope === "spec") {
        continue
      }

      latestStatus = getNewestStatus(latestStatus, parsedMessage)
    }

    return latestStatus
  }, [statusMessages])

  const latestSpecFeedStatus = useMemo(() => {
    let latestStatus: AiStatusFeedMessage | null = null

    for (const message of statusMessages) {
      const parsedMessage = parseAiStatusFeedMessage(message.data)

      if (!parsedMessage || parsedMessage.scope !== "spec") {
        continue
      }

      latestStatus = getNewestStatus(latestStatus, parsedMessage)
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

  const chatHistory = useMemo(
    () =>
      messages.map((message) => ({
        content: message.content,
        role: message.role,
        sender: message.sender,
        timestamp: message.timestamp,
      })),
    [messages],
  )
  const latestDesignStatus = getNewestStatus(
    latestDesignFeedStatus,
    latestDesignEventStatus,
  )
  const activeDesignStatus =
    latestDesignStatus && latestDesignStatus.runId === designRunId
      ? latestDesignStatus
      : null
  const latestSpecStatus = getNewestStatus(
    latestSpecFeedStatus,
    latestSpecEventStatus,
  )
  const activeSpecStatus =
    latestSpecStatus && latestSpecStatus.runId === specRunId
      ? latestSpecStatus
      : null
  const { run: activeDesignRun, error: activeDesignRunError } = useRealtimeRun(
    designRunId ?? undefined,
    {
      accessToken: designRunToken ?? undefined,
      enabled: Boolean(designRunId && designRunToken),
    },
  )
  const { run: activeSpecRun, error: activeSpecRunError } = useRealtimeRun(
    specRunId ?? undefined,
    {
      accessToken: specRunToken ?? undefined,
      enabled: Boolean(specRunId && specRunToken),
    },
  )
  const isDesignRunActive =
    designRunId !== null &&
    !activeDesignRun?.isCompleted &&
    !activeDesignRun?.isFailed &&
    !activeDesignRun?.isCancelled
  const isSpecRunActive =
    specRunId !== null &&
    !activeSpecRun?.isCompleted &&
    !activeSpecRun?.isFailed &&
    !activeSpecRun?.isCancelled
  const isSpecGenerating = isSpecRequestPending || isSpecRunActive

  const loadSpecs = useEffectEvent(async () => {
    setSpecsLoading(true)
    setSpecsError(null)

    try {
      const response = await fetch(`/api/projects/${room.id}/specs`, {
        cache: "no-store",
      })
      const body = (await response.json().catch(() => null)) as
        | (ProjectSpecsListResponse & { error?: { message?: string } })
        | null

      if (!response.ok) {
        throw new Error(
          typeof body?.error?.message === "string"
            ? body.error.message
            : "Failed to load project specs."
        )
      }

      setSpecs(Array.isArray(body?.specs) ? body.specs : [])
    } catch (error) {
      setSpecsError(
        error instanceof Error ? error.message : "Failed to load project specs."
      )
    } finally {
      setSpecsLoading(false)
    }
  })

  useEffect(() => {
    if (!props.isOpen || activeTab !== "specs") {
      return
    }

    void loadSpecs()
  }, [activeTab, props.isOpen, room.id])

  useEffect(() => {
    if (!selectedSpecId) {
      setPreviewSpec(null)
      setPreviewError(null)
      return
    }

    let isCancelled = false

    async function loadPreview() {
      setPreviewSpec(null)
      setPreviewError(null)

      try {
        const response = await fetch(`/api/projects/${room.id}/specs/${selectedSpecId}`, {
          cache: "no-store",
        })
        const body = (await response.json().catch(() => null)) as
          | (ProjectSpecContentResponse & { error?: { message?: string } })
          | null

        if (!response.ok || !body?.spec) {
          throw new Error(
            typeof body?.error?.message === "string"
              ? body.error.message
              : "Failed to load this project spec."
          )
        }

        if (isCancelled) {
          return
        }

        setPreviewSpec(body.spec)
      } catch (error) {
        if (isCancelled) {
          return
        }

        setPreviewError(
          error instanceof Error ? error.message : "Failed to load this project spec."
        )
      }
    }

    void loadPreview()

    return () => {
      isCancelled = true
    }
  }, [room.id, selectedSpecId])

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
    if (!designRunId || handledDesignRunRef.current === designRunId) {
      return
    }

    handledDesignRunRef.current = designRunId
    void pushChatErrorMessage(
      "Ghost AI lost its realtime connection before the run finished.",
    )
    setDesignRunId(null)
    setDesignRunToken(null)
  })

  const handleRunFinished = useEffectEvent(() => {
    if (!designRunId || handledDesignRunRef.current === designRunId || isDesignRunActive) {
      return
    }

    handledDesignRunRef.current = designRunId

    const finalMessage =
      activeDesignStatus?.text?.trim() ||
      (activeDesignRun?.isCompleted
        ? "Ghost AI finished the latest design update."
        : activeDesignRun?.isCancelled
          ? "Ghost AI stopped before finishing the latest design update."
          : "Ghost AI could not complete the latest design update.")

    void publishAssistantMessage(finalMessage).catch(() => {
      setSendError("Ghost AI finished, but the final room message could not be posted.")
    })

    setDesignRunId(null)
    setDesignRunToken(null)
  })

  const handleSpecRealtimeDisconnect = useEffectEvent(() => {
    if (!specRunId || handledSpecRunRef.current === specRunId) {
      return
    }

    handledSpecRunRef.current = specRunId
    setSpecGenerationError(
      "Ghost AI lost its realtime connection before the spec finished generating.",
    )
    setSpecRunId(null)
    setSpecRunToken(null)
  })

  const handleSpecRunFinished = useEffectEvent(() => {
    if (!specRunId || handledSpecRunRef.current === specRunId || isSpecRunActive) {
      return
    }

    handledSpecRunRef.current = specRunId
    setSpecRunId(null)
    setSpecRunToken(null)

    if (activeSpecRun?.isCompleted) {
      setSpecGenerationError(null)
      void loadSpecs()
      return
    }

    setSpecGenerationError(
      activeSpecStatus?.text?.trim() ||
        (activeSpecRun?.isCancelled
          ? "Ghost AI stopped before finishing the spec."
          : "Ghost AI could not complete the spec generation."),
    )
  })

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const value = draft.trim()

    if (!value || isSending || isDesignRunActive || !self) {
      return
    }

    setIsSending(true)
    setSendError(null)
    handledDesignRunRef.current = null

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

      setDesignRunId(enqueueBody.runId)

      if (typeof enqueueBody.publicToken === "string") {
        setDesignRunToken(enqueueBody.publicToken)
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

      setDesignRunToken(tokenBody.token)
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

  async function handleGenerateSpec() {
    if (isSpecGenerating) {
      return
    }

    if (canvasSnapshot.nodes.length === 0) {
      setSpecGenerationError(
        "Add at least one canvas node before generating a technical spec.",
      )
      return
    }

    setSpecGenerationError(null)
    setIsSpecRequestPending(true)
    handledSpecRunRef.current = null

    try {
      const enqueueResponse = await fetch("/api/ai/spec", {
        body: JSON.stringify({
          chatHistory,
          edges: canvasSnapshot.edges,
          nodes: canvasSnapshot.nodes,
          roomId: room.id,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })

      const enqueueBody = (await enqueueResponse.json().catch(() => null)) as
        | {
            runId?: unknown
            error?: { message?: unknown }
          }
        | null

      if (!enqueueResponse.ok || typeof enqueueBody?.runId !== "string") {
        throw new Error(
          typeof enqueueBody?.error?.message === "string"
            ? enqueueBody.error.message
            : "Ghost AI could not start the spec generation run.",
        )
      }

      setSpecRunId(enqueueBody.runId)

      const tokenResponse = await fetch("/api/ai/spec/token", {
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
        throw new Error(
          typeof tokenBody?.error?.message === "string"
            ? tokenBody.error.message
            : "Ghost AI could not connect realtime updates for this spec run.",
        )
      }

      setSpecRunToken(tokenBody.token)
      setActiveTab("specs")
    } catch (error) {
      setSpecRunId(null)
      setSpecRunToken(null)
      setSpecGenerationError(
        error instanceof Error
          ? error.message
          : "Ghost AI could not start spec generation. Please try again.",
      )
    } finally {
      setIsSpecRequestPending(false)
    }
  }

  useEffect(() => {
    if (!activeDesignRunError) {
      return
    }

    handleRealtimeDisconnect()
  }, [activeDesignRunError, handleRealtimeDisconnect])

  useEffect(() => {
    if (!activeSpecRunError) {
      return
    }

    handleSpecRealtimeDisconnect()
  }, [activeSpecRunError, handleSpecRealtimeDisconnect])

  useEffect(() => {
    handleRunFinished()
  }, [activeDesignRun, activeDesignStatus, handleRunFinished])

  useEffect(() => {
    handleSpecRunFinished()
  }, [activeSpecRun, activeSpecStatus, handleSpecRunFinished])

  return (
    <AiSidebarContent
      {...props}
      activeTab={activeTab}
      draft={draft}
      errorMessage={sendError}
      isGenerating={isDesignRunActive}
      isSending={isSending}
      isSpecGenerating={isSpecGenerating}
      latestStatus={isDesignRunActive ? activeDesignStatus : null}
      messages={messages}
      onDraftChange={setDraft}
      onGenerateSpec={handleGenerateSpec}
      onKeyDown={handleKeyDown}
      onPromptSubmit={handleSubmit}
      onSpecDownload={(specId) => downloadProjectSpec(room.id, specId)}
      onSpecPreviewChange={setSelectedSpecId}
      onTabChange={setActiveTab}
      previewError={previewError}
      previewSpec={previewSpec}
      selectedSpecId={selectedSpecId}
      specGenerationError={specGenerationError}
      specGenerationStatus={
        isSpecGenerating || activeSpecStatus?.status === "complete"
          ? activeSpecStatus
          : null
      }
      specs={specs}
      specsError={specsError}
      specsLoading={specsLoading}
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
