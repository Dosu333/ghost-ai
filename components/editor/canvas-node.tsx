"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { CanvasShape } from "@/components/editor/canvas-shape"
import { type CanvasNode } from "@/types/canvas"

const handleClassName =
  "size-3 rounded-full border border-white/40 bg-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"

export function CanvasNodeComponent({
  data,
  height = 0,
  selected,
  width = 0,
}: NodeProps<CanvasNode>) {
  const label = data.label.trim().length > 0 ? data.label : " "

  return (
    <div className="group relative">
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
          <span className="text-sm font-medium leading-5 tracking-tight">
            {label}
          </span>
        }
      />
    </div>
  )
}
