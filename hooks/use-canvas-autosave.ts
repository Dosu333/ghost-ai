"use client"

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react"

import { normalizeCanvasSnapshot } from "@/lib/canvas-persistence"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import type {
  CanvasSaveResponse,
  CanvasSaveStatus,
  CanvasSnapshot,
} from "@/types/canvas-persistence"

const AUTOSAVE_DEBOUNCE_MS = 1200

interface UseCanvasAutosaveOptions {
  enabled: boolean
  onStatusChange?: (status: CanvasSaveStatus) => void
  projectId: string
}

function serializeCanvasSnapshot(snapshot: CanvasSnapshot) {
  return JSON.stringify(snapshot)
}

function createPersistedCanvasSnapshot(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): CanvasSnapshot | null {
  return normalizeCanvasSnapshot({
    edges,
    nodes,
  })
}

export function useCanvasAutosave(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  { enabled, onStatusChange, projectId }: UseCanvasAutosaveOptions
) {
  const [, setStatus] = useState<CanvasSaveStatus>("saved")
  const hasInitializedBaselineRef = useRef(false)
  const isSavingRef = useRef(false)
  const latestSerializedSnapshotRef = useRef(
    serializeCanvasSnapshot(
      createPersistedCanvasSnapshot(nodes, edges) ?? {
        edges: [],
        nodes: [],
      }
    )
  )
  const lastTrackedSerializedSnapshotRef = useRef(
    latestSerializedSnapshotRef.current
  )
  const lastSavedSerializedSnapshotRef = useRef<string | null>(null)
  const pendingTimeoutRef = useRef<number | null>(null)

  const emitStatusChange = useEffectEvent((nextStatus: CanvasSaveStatus) => {
    onStatusChange?.(nextStatus)
  })

  const clearPendingSave = useCallback(() => {
    if (pendingTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(pendingTimeoutRef.current)
    pendingTimeoutRef.current = null
  }, [])

  const applyStatus = useCallback(
    (nextStatus: CanvasSaveStatus) => {
      setStatus(nextStatus)
      emitStatusChange(nextStatus)
    },
    [emitStatusChange]
  )

  const flushSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) {
      return
    }

    const nextSerializedSnapshot = latestSerializedSnapshotRef.current

    if (nextSerializedSnapshot === lastSavedSerializedSnapshotRef.current) {
      applyStatus("saved")
      return
    }

    isSavingRef.current = true
    applyStatus("saving")

    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: nextSerializedSnapshot,
      })

      if (!response.ok) {
        throw new Error("Canvas save failed.")
      }

      void ((await response.json()) as CanvasSaveResponse)
      lastSavedSerializedSnapshotRef.current = nextSerializedSnapshot
      lastTrackedSerializedSnapshotRef.current = nextSerializedSnapshot
      applyStatus("saved")
    } catch {
      applyStatus("error")
    } finally {
      isSavingRef.current = false

      if (
        enabled &&
        latestSerializedSnapshotRef.current !==
          lastSavedSerializedSnapshotRef.current
      ) {
        clearPendingSave()
        pendingTimeoutRef.current = window.setTimeout(() => {
          void flushSave()
        }, AUTOSAVE_DEBOUNCE_MS)
      }
    }
  }, [applyStatus, clearPendingSave, enabled, projectId])

  const queueSave = useCallback(
    (delayMs: number) => {
      if (!enabled) {
        return
      }

      clearPendingSave()
      pendingTimeoutRef.current = window.setTimeout(() => {
        void flushSave()
      }, delayMs)
    },
    [clearPendingSave, enabled, flushSave]
  )

  const syncBaseline = useCallback(
    (snapshot: CanvasSnapshot) => {
      const serializedSnapshot = serializeCanvasSnapshot(snapshot)

      hasInitializedBaselineRef.current = true
      latestSerializedSnapshotRef.current = serializedSnapshot
      lastTrackedSerializedSnapshotRef.current = serializedSnapshot
      lastSavedSerializedSnapshotRef.current = serializedSnapshot

      clearPendingSave()
      applyStatus("saved")
    },
    [applyStatus, clearPendingSave]
  )

  const saveNow = useCallback(() => {
    if (!enabled) {
      return
    }

    clearPendingSave()
    void flushSave()
  }, [clearPendingSave, enabled, flushSave])

  useEffect(() => {
    if (!enabled) {
      clearPendingSave()
      hasInitializedBaselineRef.current = false
      return
    }

    const snapshot: CanvasSnapshot = {
      edges,
      nodes,
    }
    const persistedSnapshot = normalizeCanvasSnapshot(snapshot)

    if (!persistedSnapshot) {
      return
    }

    const serializedSnapshot = serializeCanvasSnapshot(persistedSnapshot)

    latestSerializedSnapshotRef.current = serializedSnapshot

    if (!hasInitializedBaselineRef.current) {
      hasInitializedBaselineRef.current = true
      lastTrackedSerializedSnapshotRef.current = serializedSnapshot

      if (lastSavedSerializedSnapshotRef.current === null) {
        lastSavedSerializedSnapshotRef.current = serializedSnapshot
      }

      applyStatus("saved")
      return
    }

    if (serializedSnapshot === lastTrackedSerializedSnapshotRef.current) {
      return
    }

    lastTrackedSerializedSnapshotRef.current = serializedSnapshot
    applyStatus("saving")
    queueSave(AUTOSAVE_DEBOUNCE_MS)
  }, [applyStatus, clearPendingSave, edges, enabled, nodes, queueSave])

  useEffect(() => {
    return () => {
      clearPendingSave()
    }
  }, [clearPendingSave])

  return {
    saveNow,
    syncBaseline,
  }
}
