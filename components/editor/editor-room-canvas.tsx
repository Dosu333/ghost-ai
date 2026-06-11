"use client"

import { AlertTriangle, LoaderCircle } from "lucide-react"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
} from "@liveblocks/react/suspense"
import { useState } from "react"

import { CanvasErrorBoundary } from "@/components/editor/canvas-error-boundary"
import { EditorCanvas } from "@/components/editor/editor-canvas"
import type { CanvasTemplate } from "@/components/editor/starter-templates"

interface EditorRoomCanvasProps {
  roomId: string
  templateImportRequest?: {
    requestId: number
    template: CanvasTemplate
  } | null
}

interface CanvasConnectionError {
  code?: number
  message: string
}

function CanvasStatusCard({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-surface-border bg-surface/92 p-6 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-brand">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-copy-primary">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-copy-secondary">{description}</p>
      </div>
    </div>
  )
}

function CanvasLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface/90 px-4 py-3 text-sm text-copy-secondary shadow-lg shadow-black/20">
        <LoaderCircle className="h-4 w-4 animate-spin text-brand" />
        Connecting to the collaborative canvas...
      </div>
    </div>
  )
}

function CanvasConnectionGuard({
  templateImportRequest,
}: {
  templateImportRequest: EditorRoomCanvasProps["templateImportRequest"]
}) {
  const [connectionError, setConnectionError] =
    useState<CanvasConnectionError | null>(null)

  useErrorListener((error) => {
    if (error.context.type !== "ROOM_CONNECTION_ERROR") {
      return
    }

    const message =
      error.context.code === 4001
        ? "You no longer have access to this project room."
        : error.context.code === 4005
          ? "This room is currently full. Try again in a moment."
          : error.context.code === 4006
            ? "This room changed while you were connecting. Refresh and try again."
            : "We couldn't connect to Liveblocks for this project."

    setConnectionError({
      code: error.context.code,
      message,
    })
  })

  if (connectionError) {
    return (
      <CanvasStatusCard
        title="Canvas connection unavailable"
        description={connectionError.message}
      />
    )
  }

  return (
    <CanvasErrorBoundary
      fallback={
        <CanvasStatusCard
          title="Canvas failed to load"
          description="The collaborative canvas hit an unexpected error while starting up."
        />
      }
    >
      <ClientSideSuspense fallback={<CanvasLoadingState />}>
        {() => <EditorCanvas templateImportRequest={templateImportRequest} />}
      </ClientSideSuspense>
    </CanvasErrorBoundary>
  )
}

export function EditorRoomCanvas({
  roomId,
  templateImportRequest = null,
}: EditorRoomCanvasProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          thinking: false,
        }}
      >
        <CanvasConnectionGuard templateImportRequest={templateImportRequest} />
      </RoomProvider>
    </LiveblocksProvider>
  )
}
