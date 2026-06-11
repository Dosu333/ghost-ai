"use client"

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useRef } from "react"

import { CanvasNodeComponent } from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import {
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  SHAPE_DRAG_MIME_TYPE,
  type CanvasShapeDragPayload,
} from "@/types/canvas"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"

const nodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeComponent,
}

function parseShapeDragPayload(
  payload: string,
): CanvasShapeDragPayload | null {
  try {
    const parsed = JSON.parse(payload) as Partial<CanvasShapeDragPayload>

    if (
      typeof parsed.width !== "number" ||
      typeof parsed.height !== "number" ||
      typeof parsed.shape !== "string" ||
      !NODE_SHAPES.includes(parsed.shape as (typeof NODE_SHAPES)[number])
    ) {
      return null
    }

    return {
      shape: parsed.shape,
      width: parsed.width,
      height: parsed.height,
    }
  } catch {
    return null
  }
}

export function EditorCanvas() {
  const nodeIdCounterRef = useRef(0)
  const reactFlowInstanceRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(
    null,
  )
  const { edges, nodes, onConnect, onDelete, onEdgesChange, onNodesChange } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
    })

  return (
    <div
      className="relative h-full w-full"
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME_TYPE)) {
          return
        }

        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      }}
      onDrop={(event) => {
        const payload = parseShapeDragPayload(
          event.dataTransfer.getData(SHAPE_DRAG_MIME_TYPE),
        )
        const reactFlowInstance = reactFlowInstanceRef.current

        if (!payload || !reactFlowInstance) {
          return
        }

        event.preventDefault()

        nodeIdCounterRef.current += 1

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        const newNode: CanvasNode = {
          id: `${payload.shape}-${Date.now()}-${nodeIdCounterRef.current}`,
          type: CANVAS_NODE_TYPE,
          position: {
            x: position.x - payload.width / 2,
            y: position.y - payload.height / 2,
          },
          width: payload.width,
          height: payload.height,
          data: {
            label: "",
            color: DEFAULT_NODE_COLOR,
            shape: payload.shape,
          },
        }

        onNodesChange([
          {
            type: "add",
            item: newNode,
            index: nodes.length,
          },
        ])
      }}
    >
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onDelete={onDelete}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance
        }}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-base"
        nodeTypes={nodeTypes}
      >
        <MiniMap<CanvasNode>
          pannable
          zoomable
          bgColor="var(--bg-elevated)"
          className="!rounded-2xl !border !border-[var(--border-default)] !bg-elevated/95"
          maskColor="rgba(8, 8, 9, 0.68)"
          maskStrokeColor="var(--accent-primary)"
          nodeColor={(node) => node.data.color}
          nodeStrokeColor={(node) =>
            node.selected ? "var(--accent-primary)" : "var(--border-default)"
          }
        />
        <Background
          color="var(--border-default)"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  )
}
