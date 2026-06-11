"use client"

import { LayoutTemplate } from "lucide-react"

import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { CanvasShape } from "@/components/editor/canvas-shape"
import { EditorDialogFrame } from "@/components/editor/editor-dialog-frame"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StarterTemplatesModalProps {
  isOpen: boolean
  templates: CanvasTemplate[]
  onImport: (template: CanvasTemplate) => void
  onOpenChange: (open: boolean) => void
}

interface TemplateBounds {
  maxX: number
  maxY: number
  minX: number
  minY: number
}

const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = 180
const PREVIEW_PADDING = 24

function getTemplateBounds(template: CanvasTemplate): TemplateBounds {
  const [firstNode, ...otherNodes] = template.nodes

  if (!firstNode) {
    return {
      minX: 0,
      minY: 0,
      maxX: PREVIEW_WIDTH,
      maxY: PREVIEW_HEIGHT,
    }
  }

  return otherNodes.reduce<TemplateBounds>(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.position.x),
      minY: Math.min(bounds.minY, node.position.y),
      maxX: Math.max(bounds.maxX, node.position.x + (node.width ?? 0)),
      maxY: Math.max(bounds.maxY, node.position.y + (node.height ?? 0)),
    }),
    {
      minX: firstNode.position.x,
      minY: firstNode.position.y,
      maxX: firstNode.position.x + (firstNode.width ?? 0),
      maxY: firstNode.position.y + (firstNode.height ?? 0),
    },
  )
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = getTemplateBounds(template)
  const contentWidth = Math.max(bounds.maxX - bounds.minX, 1)
  const contentHeight = Math.max(bounds.maxY - bounds.minY, 1)
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / contentWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / contentHeight,
  )
  const scaledWidth = contentWidth * scale
  const scaledHeight = contentHeight * scale
  const offsetX = (PREVIEW_WIDTH - scaledWidth) / 2
  const offsetY = (PREVIEW_HEIGHT - scaledHeight) / 2

  function getNodeCenter(nodeId: string) {
    const node = template.nodes.find((entry) => entry.id === nodeId)

    if (!node) {
      return null
    }

    const width = node.width ?? 0
    const height = node.height ?? 0

    return {
      x: offsetX + (node.position.x - bounds.minX + width / 2) * scale,
      y: offsetY + (node.position.y - bounds.minY + height / 2) * scale,
    }
  }

  return (
    <div className="relative h-[180px] overflow-hidden rounded-2xl border border-surface-border bg-base/90">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(100,87,249,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(0,200,212,0.12),transparent_32%)]" />
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      >
        {template.edges.map((edge) => {
          const sourceCenter = getNodeCenter(edge.source)
          const targetCenter = getNodeCenter(edge.target)

          if (!sourceCenter || !targetCenter) {
            return null
          }

          return (
            <line
              key={edge.id}
              x1={sourceCenter.x}
              y1={sourceCenter.y}
              x2={targetCenter.x}
              y2={targetCenter.y}
              stroke="var(--text-primary)"
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
          )
        })}
      </svg>

      <div className="absolute inset-0">
        {template.nodes.map((node) => {
          const width = (node.width ?? 0) * scale
          const height = (node.height ?? 0) * scale
          const x = offsetX + (node.position.x - bounds.minX) * scale
          const y = offsetY + (node.position.y - bounds.minY) * scale
          const fontSize = Math.max(Math.min(11 * scale, 11), 7)
          const lineHeight = `${Math.max(Math.min(16 * scale, 16), 10)}px`

          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: x,
                top: y,
              }}
            >
              <CanvasShape
                color={node.data.color}
                shape={node.data.shape}
                width={width}
                height={height}
                label={
                  <span
                    className="line-clamp-2 font-medium tracking-tight"
                    style={{
                      fontSize,
                      lineHeight,
                    }}
                  >
                    {node.data.label}
                  </span>
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StarterTemplatesModal({
  isOpen,
  templates,
  onImport,
  onOpenChange,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-5xl"
      >
        <DialogTitle className="sr-only">Starter Templates</DialogTitle>
        <DialogDescription className="sr-only">
          Import a starter diagram into the collaborative canvas.
        </DialogDescription>
        <EditorDialogFrame
          title="Starter Templates"
          description="Replace the current canvas with a predefined architecture pattern."
          footer={
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          }
        >
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <article
                  key={template.id}
                  className="flex h-full flex-col rounded-2xl border border-surface-border bg-surface/75 p-4"
                >
                  <TemplatePreview template={template} />
                  <div className="mt-4 flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-elevated text-brand">
                      <LayoutTemplate className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-copy-primary">
                        {template.name}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-copy-secondary">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="mt-4 rounded-xl"
                    onClick={() => {
                      onImport(template)
                      onOpenChange(false)
                    }}
                  >
                    Import Template
                  </Button>
                </article>
              ))}
            </div>
          </ScrollArea>
        </EditorDialogFrame>
      </DialogContent>
    </Dialog>
  )
}
