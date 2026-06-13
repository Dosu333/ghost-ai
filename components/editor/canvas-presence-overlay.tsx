"use client"

import { LoaderCircle } from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"
import type { ReactFlowInstance } from "@xyflow/react"
import {
  shallow,
  useOther,
  useOthers,
} from "@liveblocks/react/suspense"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const MAX_VISIBLE_COLLABORATORS = 5

interface CanvasPresenceOverlayProps {
  canvasElement: HTMLDivElement | null
  className?: string
  reactFlowInstance: ReactFlowInstance<CanvasNode, CanvasEdge> | null
  viewportVersion: number
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  return parts
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("")
}

function getDisplayValue(other: {
  info: {
    email?: string
    name: string
  }
}) {
  return other.info.name || other.info.email || "Ghost AI user"
}

function CollaboratorAvatar({ connectionId }: { connectionId: number }) {
  const name = useOther(
    connectionId,
    getDisplayValue,
  )
  const avatar = useOther(connectionId, (other) => other.info.avatar)
  const isThinking = useOther(connectionId, (other) => other.presence.thinking)

  return avatar ? (
    <div className="relative">
      <img
        src={avatar}
        alt={name}
        className="size-9 rounded-xl border border-surface-border object-cover shadow-[0_0_0_2px_var(--bg-base)]"
      />
      {isThinking ? (
        <span className="absolute -right-1 -top-1 size-3 rounded-full border border-[var(--bg-base)] bg-ai shadow-[0_0_10px_color-mix(in_srgb,var(--accent-ai)_48%,transparent)]" />
      ) : null}
    </div>
  ) : (
    <div className="relative">
      <div className="flex size-9 items-center justify-center rounded-xl border border-surface-border bg-elevated text-xs font-semibold text-copy-primary shadow-[0_0_0_2px_var(--bg-base)]">
        {getInitials(name)}
      </div>
      {isThinking ? (
        <span className="absolute -right-1 -top-1 size-3 rounded-full border border-[var(--bg-base)] bg-ai shadow-[0_0_10px_color-mix(in_srgb,var(--accent-ai)_48%,transparent)]" />
      ) : null}
    </div>
  )
}

function PresenceCursor({
  canvasElement,
  connectionId,
  reactFlowInstance,
  viewportVersion,
}: {
  connectionId: number
  canvasElement: HTMLDivElement | null
  reactFlowInstance: ReactFlowInstance<CanvasNode, CanvasEdge> | null
  viewportVersion: number
}) {
  const cursor = useOther(connectionId, (other) => other.presence.cursor)
  const name = useOther(
    connectionId,
    getDisplayValue,
  )
  const color = useOther(
    connectionId,
    (other) => other.info.color || "var(--accent-primary)",
  )
  const isThinking = useOther(connectionId, (other) => other.presence.thinking)

  if (cursor === null) {
    return null
  }

  if (!reactFlowInstance) {
    return null
  }

  const wrapperBounds = canvasElement?.getBoundingClientRect()
  const screenPosition = reactFlowInstance.flowToScreenPosition(cursor)
  void viewportVersion

  if (!wrapperBounds) {
    return null
  }

  const x = screenPosition.x - wrapperBounds.left
  const y = screenPosition.y - wrapperBounds.top

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-10"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div className="relative">
        <svg
          aria-hidden="true"
          className="h-5 w-5 drop-shadow-[0_3px_10px_rgba(0,0,0,0.35)]"
          fill="none"
          viewBox="0 0 18 22"
        >
          <path
            d="M3 2.5L14.5 12.5L9.5 13.5L7.5 19.5L5 18L6.5 13.5L2.5 12.5L3 2.5Z"
            fill={color}
            stroke="rgba(8, 8, 9, 0.65)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className="absolute left-4 top-4 flex max-w-40 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none shadow-lg"
          style={{
            backgroundColor: color,
            color: "var(--bg-base)",
          }}
        >
          <span className="block truncate">{name}</span>
          {isThinking ? (
            <LoaderCircle
              aria-label={`${name} is thinking`}
              className="h-3 w-3 shrink-0 animate-spin"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function CanvasPresenceOverlay({
  canvasElement,
  className = "",
  reactFlowInstance,
  viewportVersion,
}: CanvasPresenceOverlayProps) {
  const { user } = useUser()
  const currentUserId = user?.id ?? null
  const collaboratorConnectionIds = useOthers(
    (others) =>
      others
        .filter((other) => other.id !== currentUserId)
        .map((other) => other.connectionId),
    shallow,
  )
  const visibleConnectionIds = collaboratorConnectionIds.slice(
    0,
    MAX_VISIBLE_COLLABORATORS,
  )
  const overflowCount = Math.max(
    collaboratorConnectionIds.length - MAX_VISIBLE_COLLABORATORS,
    0,
  )
  const hasCollaborators = collaboratorConnectionIds.length > 0

  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        {collaboratorConnectionIds.map((connectionId) => (
          <PresenceCursor
            key={`cursor-${connectionId}`}
            canvasElement={canvasElement}
            connectionId={connectionId}
            reactFlowInstance={reactFlowInstance}
            viewportVersion={viewportVersion}
          />
        ))}
      </div>

      <div
        className={[
          "pointer-events-none absolute right-4 top-4 z-20",
          className,
        ].join(" ")}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface/88 px-3 py-2 shadow-2xl shadow-black/20 backdrop-blur-md">
          {hasCollaborators ? (
            <div className="flex items-center -space-x-2">
              {visibleConnectionIds.map((connectionId) => (
                <CollaboratorAvatar
                  key={`avatar-${connectionId}`}
                  connectionId={connectionId}
                />
              ))}
              {overflowCount > 0 ? (
                <div className="flex size-9 items-center justify-center rounded-xl border border-surface-border bg-subtle text-xs font-semibold text-copy-primary shadow-[0_0_0_2px_var(--bg-base)]">
                  +{overflowCount}
                </div>
              ) : null}
            </div>
          ) : null}

          {hasCollaborators ? (
            <div
              aria-hidden="true"
              className="h-7 w-px"
              style={{ backgroundColor: "var(--border-default)" }}
            />
          ) : null}

          <div className="pointer-events-auto">
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "size-9 rounded-xl shadow-[0_0_0_2px_var(--bg-base)]",
                  userButtonTrigger:
                    "rounded-xl border border-surface-border bg-elevated/80 p-0.5 transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                },
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
