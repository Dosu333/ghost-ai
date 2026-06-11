"use client"

import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CanvasControlBarProps {
  canRedo: boolean
  canUndo: boolean
  onFitView: () => void
  onRedo: () => void
  onUndo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

function ControlButton({
  ariaLabel,
  disabled = false,
  icon: Icon,
  onClick,
  title,
}: {
  ariaLabel: string
  disabled?: boolean
  icon: typeof Minus
  onClick: () => void
  title: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        "rounded-full border border-transparent bg-transparent text-copy-secondary hover:border-surface-border hover:bg-elevated hover:text-copy-primary",
        disabled && "text-copy-faint hover:border-transparent hover:bg-transparent hover:text-copy-faint",
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export function CanvasControlBar({
  canRedo,
  canUndo,
  onFitView,
  onRedo,
  onUndo,
  onZoomIn,
  onZoomOut,
}: CanvasControlBarProps) {
  return (
    <div className="pointer-events-none absolute left-5 bottom-24 z-10">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border bg-surface/92 px-2 py-2 shadow-2xl shadow-black/25 backdrop-blur-md">
        <div className="flex items-center gap-1">
          <ControlButton
            ariaLabel="Zoom out"
            icon={Minus}
            onClick={onZoomOut}
            title="Zoom out"
          />
          <ControlButton
            ariaLabel="Fit view"
            icon={Maximize}
            onClick={onFitView}
            title="Fit view"
          />
          <ControlButton
            ariaLabel="Zoom in"
            icon={Plus}
            onClick={onZoomIn}
            title="Zoom in"
          />
        </div>
        <div
          aria-hidden="true"
          className="h-7 w-px bg-[color:var(--border-default)]"
        />
        <div className="flex items-center gap-1">
          <ControlButton
            ariaLabel="Undo"
            disabled={!canUndo}
            icon={Undo2}
            onClick={onUndo}
            title="Undo"
          />
          <ControlButton
            ariaLabel="Redo"
            disabled={!canRedo}
            icon={Redo2}
            onClick={onRedo}
            title="Redo"
          />
        </div>
      </div>
    </div>
  )
}
