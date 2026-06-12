import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"
import type { CanvasSnapshot } from "@/types/canvas-persistence"

const VALID_NODE_COLORS = new Set<string>(
  NODE_COLORS.map((color) => color.background)
)
const VALID_NODE_SHAPES = new Set<string>(NODE_SHAPES)
const DEFAULT_NODE_SHAPE: CanvasNode["data"]["shape"] = NODE_SHAPES[0]
const DEFAULT_NODE_COLOR_VALUE: CanvasNode["data"]["color"] = DEFAULT_NODE_COLOR

interface CanvasSnapshotParseResult {
  canvas: CanvasSnapshot | null
  error: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isOptionalFiniteNumber(value: unknown) {
  return value === undefined || value === null || isFiniteNumber(value)
}

function normalizeOptionalFiniteNumber(value: unknown) {
  return isFiniteNumber(value) ? value : undefined
}

function normalizeOptionalHandle(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function isValidNodeColor(value: unknown): value is CanvasNode["data"]["color"] {
  return typeof value === "string" && VALID_NODE_COLORS.has(value)
}

function isValidNodeShape(value: unknown): value is CanvasNode["data"]["shape"] {
  return typeof value === "string" && VALID_NODE_SHAPES.has(value)
}

function normalizeNode(
  value: unknown,
  index: number
): { error: string | null; node: CanvasNode | null } {
  if (!isRecord(value)) {
    return {
      error: `Node ${index} must be an object.`,
      node: null,
    }
  }

  const position = value.position
  const data = value.data

  if (typeof value.id !== "string" || value.id.length === 0) {
    return {
      error: `Node ${index} is missing a valid id.`,
      node: null,
    }
  }

  if (!isRecord(position) || !isFiniteNumber(position.x) || !isFiniteNumber(position.y)) {
    return {
      error: `Node "${value.id}" is missing a valid position.`,
      node: null,
    }
  }

  if (!isRecord(data)) {
    return {
      error: `Node "${value.id}" is missing valid data.`,
      node: null,
    }
  }

  const label = typeof data.label === "string" ? data.label : ""
  const color: CanvasNode["data"]["color"] =
    isValidNodeColor(data.color) ? data.color : DEFAULT_NODE_COLOR_VALUE
  const shape: CanvasNode["data"]["shape"] =
    isValidNodeShape(data.shape) ? data.shape : DEFAULT_NODE_SHAPE

  if (
    !isOptionalFiniteNumber(value.width) ||
    !isOptionalFiniteNumber(value.height)
  ) {
    return {
      error: `Node "${value.id}" has an invalid width or height.`,
      node: null,
    }
  }

  return {
    error: null,
    node: {
      id: value.id,
      type:
        typeof value.type === "string" && value.type.length > 0
          ? CANVAS_NODE_TYPE
          : CANVAS_NODE_TYPE,
      position: {
        x: position.x,
        y: position.y,
      },
      width: normalizeOptionalFiniteNumber(value.width),
      height: normalizeOptionalFiniteNumber(value.height),
      data: {
        color,
        label,
        shape,
      },
    },
  }
}

function normalizeEdge(
  value: unknown,
  index: number
): { edge: CanvasEdge | null; error: string | null } {
  if (!isRecord(value)) {
    return {
      edge: null,
      error: `Edge ${index} must be an object.`,
    }
  }

  const data = value.data

  if (
    typeof value.id !== "string" ||
    value.id.length === 0
  ) {
    return {
      edge: null,
      error: `Edge ${index} is missing a valid id.`,
    }
  }

  if (typeof value.source !== "string" || typeof value.target !== "string") {
    return {
      edge: null,
      error: `Edge "${value.id}" is missing a valid source or target.`,
    }
  }

  if (
    value.sourceHandle !== undefined &&
    value.sourceHandle !== null &&
    typeof value.sourceHandle !== "string"
  ) {
    return {
      edge: null,
      error: `Edge "${value.id}" has an invalid source handle.`,
    }
  }

  if (
    value.targetHandle !== undefined &&
    value.targetHandle !== null &&
    typeof value.targetHandle !== "string"
  ) {
    return {
      edge: null,
      error: `Edge "${value.id}" has an invalid target handle.`,
    }
  }

  const label = isRecord(data) && typeof data.label === "string" ? data.label : ""

  return {
    edge: {
      id: value.id,
      type:
        typeof value.type === "string" && value.type.length > 0
          ? CANVAS_EDGE_TYPE
          : CANVAS_EDGE_TYPE,
      source: value.source,
      sourceHandle: normalizeOptionalHandle(value.sourceHandle),
      target: value.target,
      targetHandle: normalizeOptionalHandle(value.targetHandle),
      data: {
        label,
      },
    },
    error: null,
  }
}

export function parseCanvasSnapshotResult(
  value: unknown
): CanvasSnapshotParseResult {
  if (!isRecord(value)) {
    return {
      canvas: null,
      error: "Canvas payload must be an object.",
    }
  }

  const { edges, nodes } = value

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return {
      canvas: null,
      error: "Canvas payload must include nodes and edges arrays.",
    }
  }

  const normalizedNodes: CanvasNode[] = []

  for (const [index, node] of nodes.entries()) {
    const result = normalizeNode(node, index)

    if (!result.node) {
      return {
        canvas: null,
        error: result.error,
      }
    }

    normalizedNodes.push(result.node)
  }

  const normalizedEdges: CanvasEdge[] = []

  for (const [index, edge] of edges.entries()) {
    const result = normalizeEdge(edge, index)

    if (!result.edge) {
      return {
        canvas: null,
        error: result.error,
      }
    }

    normalizedEdges.push(result.edge)
  }

  return {
    canvas: {
      edges: normalizedEdges,
      nodes: normalizedNodes,
    },
    error: null,
  }
}

export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  return parseCanvasSnapshotResult(value).canvas
}

export function normalizeCanvasSnapshot(snapshot: CanvasSnapshot) {
  return parseCanvasSnapshotResult(snapshot).canvas
}

export function getCanvasBlobPath(projectId: string) {
  return `canvas/${projectId}.json`
}
