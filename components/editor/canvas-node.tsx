"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { getNodeColorPair, type CanvasNode } from "@/types/canvas"

const handleClassName =
  "size-3 rounded-full border border-white/40 bg-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"

export function CanvasNodeComponent({ data }: NodeProps<CanvasNode>) {
  const colorPair = getNodeColorPair(data.color)
  const label = data.label.trim().length > 0 ? data.label : " "

  return (
    <div
      className="group relative flex h-full w-full items-center justify-center rounded-2xl border border-surface-border/80 px-4 py-3 text-center shadow-lg shadow-black/20"
      style={{
        backgroundColor: colorPair.background,
        color: colorPair.text,
      }}
    >
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

      <span className="pointer-events-none text-sm font-medium leading-5">
        {label}
      </span>
    </div>
  )
}
