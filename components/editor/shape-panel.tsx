"use client"

import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  RectangleHorizontal,
  Workflow,
} from "lucide-react"
import { type DragEvent, useRef } from "react"

import { Button } from "@/components/ui/button"
import {
  SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME_TYPE,
  type CanvasNodeShape,
  type CanvasShapeDragPayload,
} from "@/types/canvas"

interface ShapePanelProps {
  onDragEnd?: () => void
  onDragStart?: (
    shape: CanvasShapeDragPayload,
    cursorPosition: { x: number; y: number },
  ) => void
}

const SHAPE_ITEMS: Array<{
  icon: typeof RectangleHorizontal
  label: string
  shape: CanvasNodeShape
}> = [
  {
    shape: "rectangle",
    label: "Rectangle",
    icon: RectangleHorizontal,
  },
  {
    shape: "diamond",
    label: "Diamond",
    icon: Diamond,
  },
  {
    shape: "circle",
    label: "Circle",
    icon: Circle,
  },
  {
    shape: "pill",
    label: "Pill",
    icon: Workflow,
  },
  {
    shape: "cylinder",
    label: "Cylinder",
    icon: Cylinder,
  },
  {
    shape: "hexagon",
    label: "Hexagon",
    icon: Hexagon,
  },
]

const transparentDragImageDataUrl =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

export function ShapePanel({ onDragEnd, onDragStart }: ShapePanelProps) {
  const transparentDragImageRef = useRef<HTMLImageElement | null>(null)

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    payload: CanvasShapeDragPayload,
  ) {
    if (!transparentDragImageRef.current) {
      const image = new Image()
      image.src = transparentDragImageDataUrl
      transparentDragImageRef.current = image
    }

    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData(SHAPE_DRAG_MIME_TYPE, JSON.stringify(payload))
    event.dataTransfer.setDragImage(transparentDragImageRef.current, 0, 0)

    onDragStart?.(payload, {
      x: event.clientX,
      y: event.clientY,
    })
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border bg-surface/92 px-3 py-2 shadow-2xl shadow-black/25 backdrop-blur-md">
        {SHAPE_ITEMS.map(({ icon: Icon, label, shape }) => (
          <Button
            key={shape}
            type="button"
            variant="ghost"
            draggable
            className="size-11 rounded-full border border-transparent bg-transparent text-copy-secondary hover:border-surface-border hover:bg-elevated hover:text-copy-primary"
            aria-label={`Drag ${label} shape`}
            title={label}
            onDragEnd={() => {
              onDragEnd?.()
            }}
            onDragStart={(event) => {
              const payload: CanvasShapeDragPayload = {
                shape,
                ...SHAPE_DEFAULT_SIZES[shape],
              }

              handleDragStart(event, payload)
            }}
          >
            <Icon className="h-5 w-5" />
          </Button>
        ))}
      </div>
    </div>
  )
}
