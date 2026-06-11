"use client"

import { useEffect, useEffectEvent } from "react"
import type { ReactFlowInstance } from "@xyflow/react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const ZOOM_ANIMATION_DURATION_MS = 180

interface UseKeyboardShortcutsOptions {
  onRedo: () => void
  onUndo: () => void
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge> | null
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  return target.closest("input, textarea, [contenteditable='true'], [contenteditable='']") !== null
}

export function useKeyboardShortcuts({
  onRedo,
  onUndo,
  reactFlow,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return
    }

    const isMetaShortcut = event.metaKey || event.ctrlKey

    if (isMetaShortcut && event.key.toLowerCase() === "z") {
      event.preventDefault()

      if (event.shiftKey) {
        onRedo()
        return
      }

      onUndo()
      return
    }

    if (isMetaShortcut && event.key.toLowerCase() === "y") {
      event.preventDefault()
      onRedo()
      return
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault()
      void reactFlow?.zoomIn({ duration: ZOOM_ANIMATION_DURATION_MS })
      return
    }

    if (event.key === "-") {
      event.preventDefault()
      void reactFlow?.zoomOut({ duration: ZOOM_ANIMATION_DURATION_MS })
    }
  })

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}
