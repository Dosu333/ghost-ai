import { generateObject, jsonSchema } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { JsonObject, LsonObject } from "@liveblocks/node"
import { LiveMap, LiveObject } from "@liveblocks/node"
import { randomUUID } from "node:crypto"

import {
  GHOST_AI_AGENT_COLOR,
  GHOST_AI_AGENT_ID,
  GHOST_AI_AGENT_NAME,
  type AiStatusEvent,
} from "@/lib/design-agent-events"
import { getLiveblocks } from "@/lib/liveblocks"
import {
  parseCanvasSnapshot,
  parseCanvasSnapshotResult,
} from "@/lib/canvas-persistence"
import type { CanvasSnapshot } from "@/types/canvas-persistence"
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  SHAPE_MIN_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas"
import { AI_STATUS_FEED_ID, type AiStatusFeedMessage } from "@/types/tasks"

const GRID_SIZE = 40
const NODE_HORIZONTAL_SPACING = 280
const NODE_VERTICAL_SPACING = 200
const AI_MODEL = "gemini-2.5-flash"
const GOOGLE_AI_API_KEY_ENV_NAMES = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GEMINI_API_KEY",
] as const
const FLOW_STORAGE_KEY = "flow"
const FLOW_NODES_KEY = "nodes"
const FLOW_EDGES_KEY = "edges"
const HANDLE_IDS = ["top", "right", "bottom", "left"] as const

type CanvasHandleId = (typeof HANDLE_IDS)[number]

interface AddNodeOperation {
  type: "add-node"
  color?: string
  height?: number
  label: string
  nodeId?: string
  shape?: string
  width?: number
  x?: number
  y?: number
}

interface MoveNodeOperation {
  type: "move-node"
  nodeId: string
  x: number
  y: number
}

interface ResizeNodeOperation {
  type: "resize-node"
  height: number
  nodeId: string
  width: number
}

interface UpdateNodeDataOperation {
  type: "update-node-data"
  color?: string
  label?: string
  nodeId: string
  shape?: string
}

interface DeleteNodeOperation {
  type: "delete-node"
  nodeId: string
}

interface AddEdgeOperation {
  type: "add-edge"
  edgeId?: string
  label?: string
  sourceHandle?: string
  sourceNodeId: string
  targetHandle?: string
  targetNodeId: string
}

interface DeleteEdgeOperation {
  type: "delete-edge"
  edgeId: string
}

type RawDesignOperation =
  | AddEdgeOperation
  | AddNodeOperation
  | DeleteEdgeOperation
  | DeleteNodeOperation
  | MoveNodeOperation
  | ResizeNodeOperation
  | UpdateNodeDataOperation

interface RawDesignPlan {
  operations: RawDesignOperation[]
  summary: string
}

type AppliedOperation =
  | {
      type: "add-edge"
    }
  | {
      cursor: { x: number; y: number }
      type: "add-node"
    }
  | {
      type: "delete-edge"
    }
  | {
      type: "delete-node"
    }
  | {
      cursor: { x: number; y: number }
      type: "move-node"
    }
  | {
      cursor: { x: number; y: number }
      type: "resize-node"
    }
  | {
      cursor: { x: number; y: number }
      type: "update-node-data"
    }

interface ApplyDesignPlanResult {
  appliedCount: number
  operations: AppliedOperation[]
  snapshot: CanvasSnapshot
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function snapToGrid(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

function normalizeLabel(label: string | undefined) {
  const normalized = label?.trim() ?? ""
  return normalized.length > 0 ? normalized : "Untitled"
}

function getGoogleAiApiKey() {
  for (const envName of GOOGLE_AI_API_KEY_ENV_NAMES) {
    const value = process.env[envName]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  throw new Error(
    "Google Generative AI is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in the Trigger task environment and restart the worker."
  )
}

function getGoogleAiModel(modelId: string) {
  const provider = createGoogleGenerativeAI({
    apiKey: getGoogleAiApiKey(),
  })

  return provider(modelId)
}

function isNodeShape(value: string | undefined): value is CanvasNodeShape {
  return typeof value === "string" && NODE_SHAPES.includes(value as CanvasNodeShape)
}

function isNodeColor(value: string | undefined): value is CanvasNodeColor {
  return (
    typeof value === "string" &&
    NODE_COLORS.some((color) => color.background === value)
  )
}

function isCanvasHandleId(value: string | undefined): value is CanvasHandleId {
  return typeof value === "string" && HANDLE_IDS.includes(value as CanvasHandleId)
}

function serializeNode(node: CanvasNode) {
  const serialized: JsonObject = {
    data: {
      color: node.data.color,
      label: node.data.label,
      shape: node.data.shape,
    },
    id: node.id,
    position: {
      x: node.position.x,
      y: node.position.y,
    },
    type: CANVAS_NODE_TYPE,
  }

  if (typeof node.width === "number") {
    serialized.width = node.width
  }

  if (typeof node.height === "number") {
    serialized.height = node.height
  }

  return serialized
}

function serializeEdge(edge: CanvasEdge) {
  const serialized: JsonObject = {
    data: {
      label: edge.data?.label ?? "",
    },
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: CANVAS_EDGE_TYPE,
  }

  if (edge.sourceHandle) {
    serialized.sourceHandle = edge.sourceHandle
  }

  if (edge.targetHandle) {
    serialized.targetHandle = edge.targetHandle
  }

  return serialized
}

function buildCanvasSnapshotFromStorageDocument(
  value: unknown,
): CanvasSnapshot {
  if (!isRecord(value)) {
    return { edges: [], nodes: [] }
  }

  const flow = value[FLOW_STORAGE_KEY]

  if (!isRecord(flow)) {
    return { edges: [], nodes: [] }
  }

  const nodesRecord = isRecord(flow[FLOW_NODES_KEY]) ? flow[FLOW_NODES_KEY] : {}
  const edgesRecord = isRecord(flow[FLOW_EDGES_KEY]) ? flow[FLOW_EDGES_KEY] : {}
  const snapshot = parseCanvasSnapshot({
    edges: Object.values(edgesRecord),
    nodes: Object.values(nodesRecord),
  })

  return snapshot ?? { edges: [], nodes: [] }
}

function cloneSnapshot(snapshot: CanvasSnapshot): CanvasSnapshot {
  const parsed = parseCanvasSnapshotResult({
    edges: snapshot.edges.map((edge) => serializeEdge(edge)),
    nodes: snapshot.nodes.map((node) => serializeNode(node)),
  })

  if (!parsed.canvas) {
    return { edges: [], nodes: [] }
  }

  return parsed.canvas
}

function createNodeLookup(snapshot: CanvasSnapshot) {
  return new Map(snapshot.nodes.map((node) => [node.id, node]))
}

function getNodeCenter(node: CanvasNode) {
  const width = typeof node.width === "number" ? node.width : SHAPE_DEFAULT_SIZES[node.data.shape].width
  const height =
    typeof node.height === "number"
      ? node.height
      : SHAPE_DEFAULT_SIZES[node.data.shape].height

  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  }
}

function createAutoLayoutPosition(snapshot: CanvasSnapshot) {
  const index = snapshot.nodes.length
  const column = index % 3
  const row = Math.floor(index / 3)

  return {
    x: snapToGrid(column * NODE_HORIZONTAL_SPACING),
    y: snapToGrid(row * NODE_VERTICAL_SPACING),
  }
}

function normalizeNodeSize(
  shape: CanvasNodeShape,
  width?: number,
  height?: number,
) {
  const minSize = SHAPE_MIN_SIZES[shape]
  const defaultSize = SHAPE_DEFAULT_SIZES[shape]

  return {
    height: Math.max(
      typeof height === "number" && Number.isFinite(height)
        ? snapToGrid(height)
        : defaultSize.height,
      minSize.height,
    ),
    width: Math.max(
      typeof width === "number" && Number.isFinite(width)
        ? snapToGrid(width)
        : defaultSize.width,
      minSize.width,
    ),
  }
}

function createDefaultHandlePair(
  source: CanvasNode,
  target: CanvasNode,
): {
  sourceHandle: CanvasHandleId
  targetHandle: CanvasHandleId
} {
  const sourceCenter = getNodeCenter(source)
  const targetCenter = getNodeCenter(target)
  const deltaX = targetCenter.x - sourceCenter.x
  const deltaY = targetCenter.y - sourceCenter.y

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" }
  }

  return deltaY >= 0
    ? { sourceHandle: "bottom", targetHandle: "top" }
    : { sourceHandle: "top", targetHandle: "bottom" }
}

function ensureFlowStorage(root: LiveObject<LsonObject>) {
  const existingFlow = root.get(FLOW_STORAGE_KEY)
  const flow = (
    existingFlow instanceof LiveObject
      ? existingFlow
      : new LiveObject({
          [FLOW_EDGES_KEY]: new LiveMap<string, LiveObject<LsonObject>>(),
          [FLOW_NODES_KEY]: new LiveMap<string, LiveObject<LsonObject>>(),
        })
  ) as LiveObject<LsonObject>

  if (!(existingFlow instanceof LiveObject)) {
    root.set(FLOW_STORAGE_KEY, flow)
  }

  const existingNodes = flow.get(FLOW_NODES_KEY)
  const nodes =
    existingNodes instanceof LiveMap
      ? existingNodes
      : new LiveMap<string, LiveObject<LsonObject>>()

  if (!(existingNodes instanceof LiveMap)) {
    flow.set(FLOW_NODES_KEY, nodes)
  }

  const existingEdges = flow.get(FLOW_EDGES_KEY)
  const edges =
    existingEdges instanceof LiveMap
      ? existingEdges
      : new LiveMap<string, LiveObject<LsonObject>>()

  if (!(existingEdges instanceof LiveMap)) {
    flow.set(FLOW_EDGES_KEY, edges)
  }

  return { edges, nodes }
}

function updateRoomStorageSnapshot(roomId: string, snapshot: CanvasSnapshot) {
  return getLiveblocks().mutateStorage(roomId, ({ root }) => {
    const { edges, nodes } = ensureFlowStorage(root as LiveObject<LsonObject>)
    const nextNodeIds = new Set(snapshot.nodes.map((node) => node.id))
    const nextEdgeIds = new Set(snapshot.edges.map((edge) => edge.id))

    for (const nodeId of Array.from(nodes.keys())) {
      if (!nextNodeIds.has(nodeId)) {
        nodes.delete(nodeId)
      }
    }

    for (const edgeId of Array.from(edges.keys())) {
      if (!nextEdgeIds.has(edgeId)) {
        edges.delete(edgeId)
      }
    }

    for (const node of snapshot.nodes) {
      nodes.set(
        node.id,
        LiveObject.from(serializeNode(node)),
      )
    }

    for (const edge of snapshot.edges) {
      edges.set(
        edge.id,
        LiveObject.from(serializeEdge(edge)),
      )
    }
  })
}

function applyAddNode(
  snapshot: CanvasSnapshot,
  operation: AddNodeOperation,
): AppliedOperation | null {
  const shape = isNodeShape(operation.shape) ? operation.shape : NODE_SHAPES[0]
  const color = isNodeColor(operation.color) ? operation.color : DEFAULT_NODE_COLOR
  const fallbackPosition = createAutoLayoutPosition(snapshot)
  const position = {
    x:
      typeof operation.x === "number" && Number.isFinite(operation.x)
        ? snapToGrid(operation.x)
        : fallbackPosition.x,
    y:
      typeof operation.y === "number" && Number.isFinite(operation.y)
        ? snapToGrid(operation.y)
        : fallbackPosition.y,
  }
  const size = normalizeNodeSize(shape, operation.width, operation.height)
  const node: CanvasNode = {
    data: {
      color,
      label: normalizeLabel(operation.label),
      shape,
    },
    height: size.height,
    id: operation.nodeId?.trim() || `node-${randomUUID()}`,
    position,
    type: CANVAS_NODE_TYPE,
    width: size.width,
  }

  snapshot.nodes.push(node)

  return {
    cursor: getNodeCenter(node),
    type: "add-node",
  }
}

function applyMoveNode(
  snapshot: CanvasSnapshot,
  operation: MoveNodeOperation,
): AppliedOperation | null {
  const node = createNodeLookup(snapshot).get(operation.nodeId)

  if (!node) {
    return null
  }

  node.position = {
    x: snapToGrid(operation.x),
    y: snapToGrid(operation.y),
  }

  return {
    cursor: getNodeCenter(node),
    type: "move-node",
  }
}

function applyResizeNode(
  snapshot: CanvasSnapshot,
  operation: ResizeNodeOperation,
): AppliedOperation | null {
  const node = createNodeLookup(snapshot).get(operation.nodeId)

  if (!node) {
    return null
  }

  const size = normalizeNodeSize(
    node.data.shape,
    operation.width,
    operation.height,
  )
  node.width = size.width
  node.height = size.height

  return {
    cursor: getNodeCenter(node),
    type: "resize-node",
  }
}

function applyUpdateNodeData(
  snapshot: CanvasSnapshot,
  operation: UpdateNodeDataOperation,
): AppliedOperation | null {
  const node = createNodeLookup(snapshot).get(operation.nodeId)

  if (!node) {
    return null
  }

  if (typeof operation.label === "string") {
    node.data.label = normalizeLabel(operation.label)
  }

  if (isNodeColor(operation.color)) {
    node.data.color = operation.color
  }

  if (isNodeShape(operation.shape)) {
    node.data.shape = operation.shape

    const size = normalizeNodeSize(operation.shape, node.width, node.height)
    node.width = size.width
    node.height = size.height
  }

  return {
    cursor: getNodeCenter(node),
    type: "update-node-data",
  }
}

function applyDeleteNode(
  snapshot: CanvasSnapshot,
  operation: DeleteNodeOperation,
): AppliedOperation | null {
  const originalLength = snapshot.nodes.length
  snapshot.nodes = snapshot.nodes.filter((node) => node.id !== operation.nodeId)

  if (snapshot.nodes.length === originalLength) {
    return null
  }

  snapshot.edges = snapshot.edges.filter(
    (edge) =>
      edge.source !== operation.nodeId && edge.target !== operation.nodeId,
  )

  return {
    type: "delete-node",
  }
}

function applyAddEdge(
  snapshot: CanvasSnapshot,
  operation: AddEdgeOperation,
): AppliedOperation | null {
  const nodeLookup = createNodeLookup(snapshot)
  const source = nodeLookup.get(operation.sourceNodeId)
  const target = nodeLookup.get(operation.targetNodeId)

  if (!source || !target || source.id === target.id) {
    return null
  }

  const defaultHandles = createDefaultHandlePair(source, target)
  const sourceHandle = isCanvasHandleId(operation.sourceHandle)
    ? operation.sourceHandle
    : defaultHandles.sourceHandle
  const targetHandle = isCanvasHandleId(operation.targetHandle)
    ? operation.targetHandle
    : defaultHandles.targetHandle
  const duplicateEdge = snapshot.edges.some(
    (edge) =>
      edge.source === source.id &&
      edge.target === target.id &&
      edge.sourceHandle === sourceHandle &&
      edge.targetHandle === targetHandle,
  )

  if (duplicateEdge) {
    return null
  }

  snapshot.edges.push({
    data: {
      label: operation.label?.trim() ?? "",
    },
    id: operation.edgeId?.trim() || `edge-${randomUUID()}`,
    source: source.id,
    sourceHandle,
    target: target.id,
    targetHandle,
    type: CANVAS_EDGE_TYPE,
  })

  return {
    type: "add-edge",
  }
}

function applyDeleteEdge(
  snapshot: CanvasSnapshot,
  operation: DeleteEdgeOperation,
): AppliedOperation | null {
  const originalLength = snapshot.edges.length
  snapshot.edges = snapshot.edges.filter((edge) => edge.id !== operation.edgeId)

  if (snapshot.edges.length === originalLength) {
    return null
  }

  return {
    type: "delete-edge",
  }
}

function applyRawOperation(
  snapshot: CanvasSnapshot,
  operation: RawDesignOperation,
): AppliedOperation | null {
  switch (operation.type) {
    case "add-node":
      return applyAddNode(snapshot, operation)
    case "move-node":
      return applyMoveNode(snapshot, operation)
    case "resize-node":
      return applyResizeNode(snapshot, operation)
    case "update-node-data":
      return applyUpdateNodeData(snapshot, operation)
    case "delete-node":
      return applyDeleteNode(snapshot, operation)
    case "add-edge":
      return applyAddEdge(snapshot, operation)
    case "delete-edge":
      return applyDeleteEdge(snapshot, operation)
    default:
      return null
  }
}

function createCanvasSummary(snapshot: CanvasSnapshot) {
  return JSON.stringify(
    {
      edges: snapshot.edges.map((edge) => ({
        id: edge.id,
        label: edge.data?.label ?? "",
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
      })),
      nodes: snapshot.nodes.map((node) => ({
        color: node.data.color,
        height: node.height,
        id: node.id,
        label: node.data.label,
        shape: node.data.shape,
        width: node.width,
        x: node.position.x,
        y: node.position.y,
      })),
    },
    null,
    2,
  )
}

function getDesignPlanSchema() {
  return jsonSchema<RawDesignPlan>({
    additionalProperties: false,
    properties: {
      operations: {
        items: {
          anyOf: [
            {
              additionalProperties: false,
              properties: {
                color: { type: "string" },
                height: { type: "number" },
                label: { type: "string" },
                nodeId: { type: "string" },
                shape: { type: "string" },
                type: { const: "add-node", type: "string" },
                width: { type: "number" },
                x: { type: "number" },
                y: { type: "number" },
              },
              required: ["type", "label"],
              type: "object",
            },
            {
              additionalProperties: false,
              properties: {
                nodeId: { type: "string" },
                type: { const: "move-node", type: "string" },
                x: { type: "number" },
                y: { type: "number" },
              },
              required: ["type", "nodeId", "x", "y"],
              type: "object",
            },
            {
              additionalProperties: false,
              properties: {
                height: { type: "number" },
                nodeId: { type: "string" },
                type: { const: "resize-node", type: "string" },
                width: { type: "number" },
              },
              required: ["type", "nodeId", "width", "height"],
              type: "object",
            },
            {
              additionalProperties: false,
              properties: {
                color: { type: "string" },
                label: { type: "string" },
                nodeId: { type: "string" },
                shape: { type: "string" },
                type: { const: "update-node-data", type: "string" },
              },
              required: ["type", "nodeId"],
              type: "object",
            },
            {
              additionalProperties: false,
              properties: {
                nodeId: { type: "string" },
                type: { const: "delete-node", type: "string" },
              },
              required: ["type", "nodeId"],
              type: "object",
            },
            {
              additionalProperties: false,
              properties: {
                edgeId: { type: "string" },
                label: { type: "string" },
                sourceHandle: { type: "string" },
                sourceNodeId: { type: "string" },
                targetHandle: { type: "string" },
                targetNodeId: { type: "string" },
                type: { const: "add-edge", type: "string" },
              },
              required: ["type", "sourceNodeId", "targetNodeId"],
              type: "object",
            },
            {
              additionalProperties: false,
              properties: {
                edgeId: { type: "string" },
                type: { const: "delete-edge", type: "string" },
              },
              required: ["type", "edgeId"],
              type: "object",
            },
          ],
        },
        maxItems: 24,
        type: "array",
      },
      summary: {
        type: "string",
      },
    },
    required: ["summary", "operations"],
    type: "object",
  })
}

export async function loadRoomCanvasSnapshot(roomId: string) {
  try {
    const document = await getLiveblocks().getStorageDocument(roomId, "json")
    return buildCanvasSnapshotFromStorageDocument(document)
  } catch {
    return {
      edges: [],
      nodes: [],
    }
  }
}

export async function createDesignPlan(
  prompt: string,
  snapshot: CanvasSnapshot,
) {
  const result = await generateObject({
    model: getGoogleAiModel(AI_MODEL),
    providerOptions: {
      google: {
        structuredOutputs: true,
        thinkingConfig: {
          thinkingBudget: 512,
        },
      },
    },
    prompt: [
      "Create a concise canvas update plan for a collaborative system design workspace.",
      "Return only the structured plan.",
      "",
      "Rules:",
      "- Use only these node shapes: rectangle, diamond, circle, pill, cylinder, hexagon.",
      `- Use only these node colors: ${NODE_COLORS.map((color) => color.background).join(", ")}.`,
      "- Prefer 160px+ visual spacing between nodes and place items on a rough 40px grid.",
      "- Reuse existing node IDs when moving, resizing, editing, or deleting nodes.",
      "- Only add edges between nodes that exist after your operations.",
      "- Use handles top, right, bottom, or left when you specify edge handles.",
      "- Keep plans compact and high-signal. Do not narrate outside the summary field.",
      "",
      `User prompt:\n${prompt}`,
      "",
      `Current canvas:\n${createCanvasSummary(snapshot)}`,
    ].join("\n"),
    schema: getDesignPlanSchema(),
    schemaDescription:
      "A structured set of allowed canvas operations for a collaborative system design editor.",
    schemaName: "ghost_ai_design_plan",
    system:
      "You are Ghost AI, an architecture design collaborator. Produce only valid room-edit operations that improve the shared diagram.",
  })

  return result.object
}

export function applyDesignPlan(
  initialSnapshot: CanvasSnapshot,
  plan: RawDesignPlan,
): ApplyDesignPlanResult {
  const workingSnapshot = cloneSnapshot(initialSnapshot)
  const appliedOperations: AppliedOperation[] = []

  for (const operation of plan.operations) {
    const applied = applyRawOperation(workingSnapshot, operation)

    if (applied) {
      appliedOperations.push(applied)
    }
  }

  return {
    appliedCount: appliedOperations.length,
    operations: appliedOperations,
    snapshot: workingSnapshot,
  }
}

export async function persistRoomCanvasSnapshot(
  roomId: string,
  snapshot: CanvasSnapshot,
) {
  await updateRoomStorageSnapshot(roomId, snapshot)
}

export async function publishAiStatus(input: {
  message: string
  roomId: string
  runId: string
  scope: AiStatusFeedMessage["scope"]
  status: AiStatusFeedMessage["status"]
}) {
  const liveblocks = getLiveblocks()
  const timestamp = new Date().toISOString()
  const data = {
    runId: input.runId,
    scope: input.scope,
    status: input.status,
    text: input.message,
    timestamp,
  }

  await liveblocks
    .createFeed({
      feedId: AI_STATUS_FEED_ID,
      roomId: input.roomId,
    })
    .catch(() => {})

  await liveblocks.createFeedMessage({
    data,
    feedId: AI_STATUS_FEED_ID,
    roomId: input.roomId,
  })

  await liveblocks.broadcastEvent(input.roomId, {
    data,
    eventId: `${input.runId}:${input.status}:${Date.now()}`,
    feedId: AI_STATUS_FEED_ID,
    type: "ai-status",
  })
}

export async function publishDesignAgentStatus(input: {
  message: string
  prompt?: string
  roomId: string
  runId: string
  status: AiStatusFeedMessage["status"]
}) {
  void input.prompt

  return publishAiStatus({
    message: input.message,
    roomId: input.roomId,
    runId: input.runId,
    scope: "design",
    status: input.status,
  })
}

export async function publishSpecAgentStatus(input: {
  message: string
  roomId: string
  runId: string
  status: AiStatusFeedMessage["status"]
}) {
  return publishAiStatus({
    message: input.message,
    roomId: input.roomId,
    runId: input.runId,
    scope: "spec",
    status: input.status,
  })
}

export async function setDesignAgentPresence(input: {
  cursor: { x: number; y: number } | null
  roomId: string
  thinking: boolean
  ttl?: number
}) {
  await getLiveblocks().setPresence(input.roomId, {
    data: {
      cursor: input.cursor,
      thinking: input.thinking,
    },
    ttl: input.ttl ?? 60,
    userId: GHOST_AI_AGENT_ID,
    userInfo: {
      color: GHOST_AI_AGENT_COLOR,
      name: GHOST_AI_AGENT_NAME,
    },
  })
}
