"use client"

import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react"
import { useEffect, useRef, useState, type SyntheticEvent } from "react"

import { CanvasShape } from "@/components/editor/canvas-shape"
import {
  EMPTY_NODE_LABEL_PLACEHOLDER,
  SHAPE_MIN_SIZES,
  type CanvasNode,
} from "@/types/canvas"

const handleClassName =
  "size-3 rounded-full border border-white/40 bg-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
const resizeHandleClassName =
  "size-3 rounded-full border border-[var(--accent-primary)] bg-[var(--bg-elevated)] shadow-sm shadow-black/30"
const resizeLineClassName = "border-[var(--border-subtle)] opacity-70"

interface CanvasNodeComponentProps extends NodeProps<CanvasNode> {
  onLabelChange: (nodeId: string, label: string) => void
}

export function CanvasNodeComponent({
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

  function stopCanvasInteraction(event: SyntheticEvent) {
    event.stopPropagation()
  }

  function handleLabelUpdate(nextLabel: string) {
    setDraftLabel(nextLabel)
    onLabelChange(id, nextLabel)
  }

  return (
    <div className="group relative">
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
        type="target"
        position={Position.Top}
        className={handleClassName}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={handleClassName}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={handleClassName}
      />
      <Handle
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
            >
              {label}
            </button>
          )
        }
      />
    </div>
  )
}
