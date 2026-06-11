import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

interface TemplateNodeConfig {
  color: CanvasNodeColor
  height: number
  id: string
  label: string
  shape: CanvasNodeShape
  width: number
  x: number
  y: number
}

interface TemplateEdgeConfig {
  id: string
  label?: string
  source: string
  sourceHandle?: string
  target: string
  targetHandle?: string
}

function createTemplateNode({
  color,
  height,
  id,
  label,
  shape,
  width,
  x,
  y,
}: TemplateNodeConfig): CanvasNode {
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: {
      x,
      y,
    },
    width,
    height,
    data: {
      color,
      label,
      shape,
    },
  }
}

function createTemplateEdge({
  id,
  label = "",
  source,
  sourceHandle,
  target,
  targetHandle,
}: TemplateEdgeConfig): CanvasEdge {
  return {
    id,
    type: CANVAS_EDGE_TYPE,
    source,
    sourceHandle,
    target,
    targetHandle,
    data: {
      label,
    },
  }
}

const neutral = NODE_COLORS[0].background
const blue = NODE_COLORS[1].background
const purple = NODE_COLORS[2].background
const orange = NODE_COLORS[3].background
const red = NODE_COLORS[4].background
const pink = NODE_COLORS[5].background
const green = NODE_COLORS[6].background
const teal = NODE_COLORS[7].background

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-platform",
    name: "Microservices Platform",
    description:
      "Gateway, core services, shared data stores, and async processing for a service-based backend.",
    nodes: [
      createTemplateNode({
        id: "ms-clients",
        label: "Web + Mobile Clients",
        shape: "pill",
        color: blue,
        width: 220,
        height: 96,
        x: 40,
        y: 40,
      }),
      createTemplateNode({
        id: "ms-gateway",
        label: "API Gateway",
        shape: "hexagon",
        color: teal,
        width: 220,
        height: 120,
        x: 330,
        y: 28,
      }),
      createTemplateNode({
        id: "ms-auth",
        label: "Auth Service",
        shape: "rectangle",
        color: purple,
        width: 186,
        height: 104,
        x: 180,
        y: 220,
      }),
      createTemplateNode({
        id: "ms-orders",
        label: "Orders Service",
        shape: "rectangle",
        color: green,
        width: 198,
        height: 104,
        x: 430,
        y: 206,
      }),
      createTemplateNode({
        id: "ms-billing",
        label: "Billing Service",
        shape: "rectangle",
        color: orange,
        width: 198,
        height: 104,
        x: 680,
        y: 206,
      }),
      createTemplateNode({
        id: "ms-users-db",
        label: "Users DB",
        shape: "cylinder",
        color: neutral,
        width: 172,
        height: 116,
        x: 190,
        y: 402,
      }),
      createTemplateNode({
        id: "ms-orders-db",
        label: "Orders DB",
        shape: "cylinder",
        color: neutral,
        width: 172,
        height: 116,
        x: 444,
        y: 402,
      }),
      createTemplateNode({
        id: "ms-events",
        label: "Event Bus",
        shape: "circle",
        color: pink,
        width: 142,
        height: 142,
        x: 730,
        y: 388,
      }),
      createTemplateNode({
        id: "ms-workers",
        label: "Async Workers",
        shape: "diamond",
        color: red,
        width: 174,
        height: 130,
        x: 978,
        y: 214,
      }),
    ],
    edges: [
      createTemplateEdge({
        id: "ms-e1",
        source: "ms-clients",
        sourceHandle: "right",
        target: "ms-gateway",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ms-e2",
        source: "ms-gateway",
        sourceHandle: "bottom",
        target: "ms-auth",
        targetHandle: "top",
        label: "JWT",
      }),
      createTemplateEdge({
        id: "ms-e3",
        source: "ms-gateway",
        sourceHandle: "bottom",
        target: "ms-orders",
        targetHandle: "top",
      }),
      createTemplateEdge({
        id: "ms-e4",
        source: "ms-gateway",
        sourceHandle: "bottom",
        target: "ms-billing",
        targetHandle: "top",
      }),
      createTemplateEdge({
        id: "ms-e5",
        source: "ms-auth",
        sourceHandle: "bottom",
        target: "ms-users-db",
        targetHandle: "top",
      }),
      createTemplateEdge({
        id: "ms-e6",
        source: "ms-orders",
        sourceHandle: "bottom",
        target: "ms-orders-db",
        targetHandle: "top",
      }),
      createTemplateEdge({
        id: "ms-e7",
        source: "ms-orders",
        sourceHandle: "right",
        target: "ms-events",
        targetHandle: "left",
        label: "publish",
      }),
      createTemplateEdge({
        id: "ms-e8",
        source: "ms-billing",
        sourceHandle: "bottom",
        target: "ms-events",
        targetHandle: "top",
      }),
      createTemplateEdge({
        id: "ms-e9",
        source: "ms-events",
        sourceHandle: "right",
        target: "ms-workers",
        targetHandle: "left",
        label: "consume",
      }),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "A streamlined delivery flow from source control through tests, artifacts, and staged deployments.",
    nodes: [
      createTemplateNode({
        id: "ci-source",
        label: "Source Repo",
        shape: "rectangle",
        color: blue,
        width: 196,
        height: 102,
        x: 36,
        y: 180,
      }),
      createTemplateNode({
        id: "ci-trigger",
        label: "Push / PR",
        shape: "circle",
        color: teal,
        width: 136,
        height: 136,
        x: 310,
        y: 164,
      }),
      createTemplateNode({
        id: "ci-build",
        label: "Build + Unit Tests",
        shape: "diamond",
        color: purple,
        width: 202,
        height: 136,
        x: 536,
        y: 164,
      }),
      createTemplateNode({
        id: "ci-artifacts",
        label: "Artifact Registry",
        shape: "cylinder",
        color: neutral,
        width: 176,
        height: 118,
        x: 850,
        y: 44,
      }),
      createTemplateNode({
        id: "ci-staging",
        label: "Staging Deploy",
        shape: "pill",
        color: green,
        width: 216,
        height: 98,
        x: 850,
        y: 212,
      }),
      createTemplateNode({
        id: "ci-smoke",
        label: "Smoke Tests",
        shape: "rectangle",
        color: orange,
        width: 184,
        height: 102,
        x: 1150,
        y: 210,
      }),
      createTemplateNode({
        id: "ci-approval",
        label: "Manual Approval",
        shape: "hexagon",
        color: pink,
        width: 220,
        height: 122,
        x: 1450,
        y: 198,
      }),
      createTemplateNode({
        id: "ci-prod",
        label: "Production",
        shape: "pill",
        color: red,
        width: 210,
        height: 100,
        x: 1760,
        y: 210,
      }),
    ],
    edges: [
      createTemplateEdge({
        id: "ci-e1",
        source: "ci-source",
        sourceHandle: "right",
        target: "ci-trigger",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ci-e2",
        source: "ci-trigger",
        sourceHandle: "right",
        target: "ci-build",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ci-e3",
        source: "ci-build",
        sourceHandle: "right",
        target: "ci-artifacts",
        targetHandle: "left",
        label: "package",
      }),
      createTemplateEdge({
        id: "ci-e4",
        source: "ci-build",
        sourceHandle: "right",
        target: "ci-staging",
        targetHandle: "left",
        label: "deploy",
      }),
      createTemplateEdge({
        id: "ci-e5",
        source: "ci-staging",
        sourceHandle: "right",
        target: "ci-smoke",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ci-e6",
        source: "ci-smoke",
        sourceHandle: "right",
        target: "ci-approval",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ci-e7",
        source: "ci-approval",
        sourceHandle: "right",
        target: "ci-prod",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ci-e8",
        source: "ci-artifacts",
        sourceHandle: "bottom",
        target: "ci-staging",
        targetHandle: "top",
      }),
    ],
  },
  {
    id: "event-driven-platform",
    name: "Event-Driven Platform",
    description:
      "Ingress services publish domain events that fan out to analytics, notifications, and downstream processors.",
    nodes: [
      createTemplateNode({
        id: "ed-clients",
        label: "Client Apps",
        shape: "pill",
        color: blue,
        width: 220,
        height: 96,
        x: 38,
        y: 70,
      }),
      createTemplateNode({
        id: "ed-api",
        label: "Ingress API",
        shape: "rectangle",
        color: teal,
        width: 194,
        height: 104,
        x: 344,
        y: 64,
      }),
      createTemplateNode({
        id: "ed-topic",
        label: "Event Stream",
        shape: "circle",
        color: pink,
        width: 148,
        height: 148,
        x: 666,
        y: 44,
      }),
      createTemplateNode({
        id: "ed-orders",
        label: "Order Processor",
        shape: "rectangle",
        color: green,
        width: 206,
        height: 106,
        x: 956,
        y: 12,
      }),
      createTemplateNode({
        id: "ed-notify",
        label: "Notification Worker",
        shape: "diamond",
        color: orange,
        width: 190,
        height: 134,
        x: 952,
        y: 202,
      }),
      createTemplateNode({
        id: "ed-analytics",
        label: "Analytics Sink",
        shape: "hexagon",
        color: purple,
        width: 214,
        height: 122,
        x: 1278,
        y: 36,
      }),
      createTemplateNode({
        id: "ed-cache",
        label: "Read Cache",
        shape: "cylinder",
        color: neutral,
        width: 174,
        height: 118,
        x: 1276,
        y: 226,
      }),
      createTemplateNode({
        id: "ed-dead-letter",
        label: "Dead Letter Queue",
        shape: "rectangle",
        color: red,
        width: 212,
        height: 108,
        x: 1588,
        y: 144,
      }),
    ],
    edges: [
      createTemplateEdge({
        id: "ed-e1",
        source: "ed-clients",
        sourceHandle: "right",
        target: "ed-api",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ed-e2",
        source: "ed-api",
        sourceHandle: "right",
        target: "ed-topic",
        targetHandle: "left",
        label: "publish",
      }),
      createTemplateEdge({
        id: "ed-e3",
        source: "ed-topic",
        sourceHandle: "right",
        target: "ed-orders",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ed-e4",
        source: "ed-topic",
        sourceHandle: "right",
        target: "ed-notify",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ed-e5",
        source: "ed-topic",
        sourceHandle: "right",
        target: "ed-analytics",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ed-e6",
        source: "ed-orders",
        sourceHandle: "right",
        target: "ed-cache",
        targetHandle: "left",
      }),
      createTemplateEdge({
        id: "ed-e7",
        source: "ed-notify",
        sourceHandle: "right",
        target: "ed-dead-letter",
        targetHandle: "left",
        label: "retry / fail",
      }),
    ],
  },
]
