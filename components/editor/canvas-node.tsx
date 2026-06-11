"use client"

import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react"
import { useEffect, useRef, useState, type SyntheticEvent } from "react"

import { CanvasShape } from "@/components/editor/canvas-shape"
import {
  EMPTY_NODE_LABEL_PLACEHOLDER,
  NODE_COLORS,
  SHAPE_MIN_SIZES,
  type CanvasNodeColor,
  type CanvasNode,
} from "@/types/canvas"

const handleClassName =
  "size-3 rounded-full border border-[var(--bg-base)] bg-[var(--text-primary)] opacity-0 shadow-sm shadow-black/40 transition-opacity duration-150 group-hover:opacity-100"
const resizeHandleClassName =
  "size-3 rounded-full border border-[var(--accent-primary)] bg-[var(--bg-elevated)] shadow-sm shadow-black/30"
const resizeLineClassName = "border-[var(--border-subtle)] opacity-70"

interface CanvasNodeComponentProps extends NodeProps<CanvasNode> {
  onColorChange: (nodeId: string, color: CanvasNodeColor) => void
  onLabelChange: (nodeId: string, label: string) => void
}

function stopCanvasInteraction(event: SyntheticEvent) {
  event.stopPropagation()
}

function NodeColorToolbar({
  activeColor,
  onColorSelect,
}: {
  activeColor: CanvasNodeColor
  onColorSelect: (color: CanvasNodeColor) => void
}) {
  return (
    <div
      className="nodrag nopan absolute left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-[calc(100%+12px)] items-center gap-2 rounded-2xl border border-surface-border bg-surface/95 px-3 py-2 shadow-lg shadow-black/30 backdrop-blur-sm"
      onClick={stopCanvasInteraction}
      onDoubleClick={stopCanvasInteraction}
      onMouseDown={stopCanvasInteraction}
      onPointerDown={stopCanvasInteraction}
    >
      {NODE_COLORS.map((colorPair) => {
        const isActive = colorPair.background === activeColor

        return (
          <button
            key={colorPair.background}
            type="button"
            aria-label={`Select node color ${colorPair.background}`}
            className="h-5 w-5 rounded-full border transition-transform duration-150 hover:scale-105 focus-visible:outline-none"
            style={{
              backgroundColor: colorPair.background,
              borderColor: isActive ? colorPair.text : "var(--border-subtle)",
              boxShadow: isActive
                ? `0 0 0 2px color-mix(in srgb, ${colorPair.text} 24%, transparent), 0 0 10px color-mix(in srgb, ${colorPair.text} 28%, transparent)`
                : undefined,
            }}
            onClick={(event) => {
              stopCanvasInteraction(event)
              onColorSelect(colorPair.background)
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.boxShadow = isActive
                ? `0 0 0 2px color-mix(in srgb, ${colorPair.text} 24%, transparent), 0 0 10px color-mix(in srgb, ${colorPair.text} 28%, transparent)`
                : `0 0 8px color-mix(in srgb, ${colorPair.text} 30%, transparent)`
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.boxShadow = isActive
                ? `0 0 0 2px color-mix(in srgb, ${colorPair.text} 24%, transparent), 0 0 10px color-mix(in srgb, ${colorPair.text} 28%, transparent)`
                : ""
            }}
          />
        )
      })}
    </div>
  )
}

export function CanvasNodeComponent({
  onColorChange,
  data,
  id,
  height = 0,
  onLabelChange,
  selected,
  width = 0,
}: CanvasNodeComponentProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(data.label)
  const label = data.label.trim().length > 0 ? data.label : EMPTY_NODE_LABEL_PLACEHOLDER
  const isPlaceholder = data.label.trim().length === 0
  const minSize = SHAPE_MIN_SIZES[data.shape]
  const textareaWidth = Math.max(Math.min(width - 40, 240), 96)
  const textareaMinHeight = Math.max(Math.min(height - 32, 72), 40)

  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(data.label)
    }
  }, [data.label, isEditing])

  useEffect(() => {
    if (!isEditing) {
      return
    }

    textareaRef.current?.focus()
    textareaRef.current?.select()
  }, [isEditing])

  function handleLabelUpdate(nextLabel: string) {
    setDraftLabel(nextLabel)
    onLabelChange(id, nextLabel)
  }

  return (
    <div className="group relative">
      {selected ? (
        <NodeColorToolbar
          activeColor={data.color}
          onColorSelect={(color) => {
            onColorChange(id, color)
          }}
        />
      ) : null}
      <NodeResizer
        isVisible={selected}
        minWidth={minSize.width}
        minHeight={minSize.height}
        autoScale
        color="var(--accent-primary)"
        handleClassName={resizeHandleClassName}
        lineClassName={resizeLineClassName}
        handleStyle={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--accent-primary)",
        }}
        lineStyle={{
          borderColor: "var(--border-subtle)",
        }}
      />
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className={handleClassName}
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className={handleClassName}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className={handleClassName}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={handleClassName}
      />

      <CanvasShape
        color={data.color}
        shape={data.shape}
        width={width}
        height={height}
        selected={selected}
        label={
          isEditing ? (
            <textarea
              ref={textareaRef}
              value={draftLabel}
              rows={1}
              placeholder={EMPTY_NODE_LABEL_PLACEHOLDER}
              className="nodrag nopan pointer-events-auto resize-none overflow-hidden rounded-xl border border-[var(--accent-primary)] bg-transparent px-4 py-2 text-center text-sm font-medium leading-5 tracking-tight text-copy-primary outline-none placeholder:text-copy-faint"
              style={{
                minHeight: textareaMinHeight,
                width: textareaWidth,
              }}
              onBlur={() => {
                setIsEditing(false)
              }}
              onChange={(event) => {
                handleLabelUpdate(event.target.value)
              }}
              onDoubleClick={stopCanvasInteraction}
              onKeyDown={(event) => {
                stopCanvasInteraction(event)

                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  setIsEditing(false)
                  return
                }

                if (event.key === "Escape") {
                  event.preventDefault()
                  setIsEditing(false)
                }
              }}
              onMouseDown={stopCanvasInteraction}
              onPointerDown={stopCanvasInteraction}
            />
          ) : (
            <button
              type="button"
              className={`pointer-events-auto max-w-full rounded-xl px-4 py-2 text-center text-sm font-medium leading-5 tracking-tight outline-none ${isPlaceholder ? "text-copy-faint" : ""}`}
              onDoubleClick={(event) => {
                stopCanvasInteraction(event)
                setIsEditing(true)
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return
                }

                event.preventDefault()
                stopCanvasInteraction(event)
                setIsEditing(true)
              }}
            >
              {label}
            </button>
          )
        }
      />
    </div>
  )
}
