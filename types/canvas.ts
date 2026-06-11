import type { Edge, Node } from "@xyflow/react"

export const NODE_COLORS = [
  {
    background: "#1F1F1F",
    text: "#EDEDED",
  },
  {
    background: "#10233D",
    text: "#52A8FF",
  },
  {
    background: "#2E1938",
    text: "#BF7AF0",
  },
  {
    background: "#331B00",
    text: "#FF990A",
  },
  {
    background: "#3C1618",
    text: "#FF6166",
  },
  {
    background: "#3A1726",
    text: "#F75F8F",
  },
  {
    background: "#0F2E18",
    text: "#62C073",
  },
  {
    background: "#062822",
    text: "#0AC7B4",
  },
] as const

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export const SHAPE_DRAG_MIME_TYPE = "application/x-ghost-ai-shape"

export const CANVAS_NODE_TYPE = "canvasNode"
export const CANVAS_EDGE_TYPE = "canvasEdge"
export const DEFAULT_NODE_COLOR = NODE_COLORS[0].background
export const EMPTY_NODE_LABEL_PLACEHOLDER = "Untitled"

export const SHAPE_DEFAULT_SIZES = {
  rectangle: {
    width: 220,
    height: 112,
  },
  diamond: {
    width: 200,
    height: 136,
  },
  circle: {
    width: 132,
    height: 132,
  },
  pill: {
    width: 220,
    height: 104,
  },
  cylinder: {
    width: 188,
    height: 124,
  },
  hexagon: {
    width: 204,
    height: 118,
  },
} as const

export const SHAPE_MIN_SIZES = {
  rectangle: {
    width: 140,
    height: 72,
  },
  diamond: {
    width: 132,
    height: 96,
  },
  circle: {
    width: 96,
    height: 96,
  },
  pill: {
    width: 140,
    height: 72,
  },
  cylinder: {
    width: 136,
    height: 88,
  },
  hexagon: {
    width: 140,
    height: 88,
  },
} as const

export type CanvasNodeShape = (typeof NODE_SHAPES)[number]
export type CanvasNodeColor = (typeof NODE_COLORS)[number]["background"]

export interface CanvasShapeDragPayload {
  height: number
  shape: CanvasNodeShape
  width: number
}

export interface CanvasNodeData extends Record<string, unknown> {
  color: CanvasNodeColor
  label: string
  shape: CanvasNodeShape
}

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>

export interface CanvasEdgeData extends Record<string, unknown> {
  label: string
}

export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>

export function getNodeColorPair(color: CanvasNodeColor) {
  return NODE_COLORS.find((entry) => entry.background === color) ?? NODE_COLORS[0]
}
