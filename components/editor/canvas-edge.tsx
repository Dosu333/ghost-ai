"use client"

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react"
import { useEffect, useState, type SyntheticEvent } from "react"

import type { CanvasEdge } from "@/types/canvas"

const EMPTY_EDGE_LABEL_HINT = "Add label"

function stopCanvasInteraction(event: SyntheticEvent) {
  event.stopPropagation()
}

interface CanvasEdgeComponentProps extends EdgeProps<CanvasEdge> {
  onLabelChange: (edgeId: string, label: string) => void
}

export function CanvasEdgeComponent({
  data,
  id,
  markerEnd,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  style,
  targetPosition,
  targetX,
  targetY,
  onLabelChange,
}: CanvasEdgeComponentProps) {
  const savedLabel = data?.label ?? ""
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [draftLabel, setDraftLabel] = useState(savedLabel)

  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(savedLabel)
    }
  }, [isEditing, savedLabel])

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 18,
    offset: 22,
  })

  const isActive = selected || isHovered || isEditing
  const trimmedLabel = savedLabel.trim()
  const shouldShowLabel = trimmedLabel.length > 0 || isActive || isEditing
  const inputWidth = `${Math.max(draftLabel.trim().length + 2, 8)}ch`

  function commitLabel(nextLabel: string) {
    const normalizedLabel = nextLabel.trim()

    setDraftLabel(normalizedLabel)
    onLabelChange(id, normalizedLabel)
  }

  return (
    <>
      <g
        onDoubleClick={(event) => {
          stopCanvasInteraction(event)
          setIsEditing(true)
        }}
        onMouseEnter={() => {
          setIsHovered(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
      >
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          interactionWidth={28}
          style={{
            ...style,
            opacity: isActive ? 0.98 : 0.6,
            stroke: "var(--text-primary)",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 1.5,
            transition:
              "opacity 160ms ease, stroke-width 160ms ease, filter 160ms ease",
            filter: isActive
              ? "drop-shadow(0 0 8px color-mix(in srgb, var(--text-primary) 24%, transparent))"
              : "none",
          }}
        />
      </g>
      {shouldShowLabel ? (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute left-0 top-0"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {isEditing ? (
              <input
                autoFocus
                value={draftLabel}
                className="nodrag nopan pointer-events-auto h-8 min-w-[72px] rounded-full border border-[var(--accent-primary)] bg-surface/95 px-3 text-center text-xs font-medium tracking-tight text-copy-primary outline-none shadow-lg shadow-black/30"
                style={{
                  width: inputWidth,
                }}
                onBlur={() => {
                  commitLabel(draftLabel)
                  setIsEditing(false)
                }}
                onChange={(event) => {
                  setDraftLabel(event.target.value)
                }}
                onClick={stopCanvasInteraction}
                onDoubleClick={stopCanvasInteraction}
                onKeyDown={(event) => {
                  stopCanvasInteraction(event)

                  if (event.key === "Enter" || event.key === "Escape") {
                    event.preventDefault()
                    commitLabel(draftLabel)
                    setIsEditing(false)
                  }
                }}
                onMouseDown={stopCanvasInteraction}
                onPointerDown={stopCanvasInteraction}
              />
            ) : (
              <button
                type="button"
                className={`nodrag nopan pointer-events-auto rounded-full border px-3 py-1 text-[11px] font-medium tracking-tight shadow-lg shadow-black/20 transition-colors duration-150 ${trimmedLabel.length > 0 ? "border-surface-border bg-surface/95 text-copy-primary" : "bg-surface/75 text-copy-faint"}`}
                style={
                  trimmedLabel.length === 0
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--border-subtle) 80%, transparent)",
                      }
                    : undefined
                }
                onClick={stopCanvasInteraction}
                onDoubleClick={(event) => {
                  stopCanvasInteraction(event)
                  setIsEditing(true)
                }}
                onMouseDown={stopCanvasInteraction}
                onPointerDown={stopCanvasInteraction}
              >
                {trimmedLabel.length > 0 ? trimmedLabel : EMPTY_EDGE_LABEL_HINT}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
