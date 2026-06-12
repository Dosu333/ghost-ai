import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export interface CanvasSnapshot {
  edges: CanvasEdge[]
  nodes: CanvasNode[]
}

export interface CanvasSaveRequestBody extends CanvasSnapshot {}

export interface CanvasSaveResponse {
  canvasJsonPath: string
}

export interface CanvasLoadResponse {
  canvas: CanvasSnapshot | null
  canvasJsonPath: string | null
}

export type CanvasSaveStatus = "saving" | "saved" | "error"
