"use client"

import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  type EdgeChange,
  type EdgeProps,
  type NodeProps,
  ReactFlow,
  type DefaultEdgeOptions,
  type OnConnect,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { CanvasEdgeComponent } from "@/components/editor/canvas-edge"
import { CanvasNodeComponent } from "@/components/editor/canvas-node"
import { CanvasShape } from "@/components/editor/canvas-shape"
import { ShapePanel } from "@/components/editor/shape-panel"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  SHAPE_DRAG_MIME_TYPE,
  type CanvasNodeColor,
  type CanvasShapeDragPayload,
} from "@/types/canvas"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"

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

interface DragPreviewState {
  cursorX: number
  cursorY: number
  payload: CanvasShapeDragPayload
}

export function EditorCanvas() {
  const nodeIdCounterRef = useRef(0)
  const nodesRef = useRef<CanvasNode[]>([])
  const edgesRef = useRef<CanvasEdge[]>([])
  const reactFlowInstanceRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(
    null,
  )
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null)
  const isDraggingShape = dragPreview !== null
  const { edges, nodes, onDelete, onEdgesChange, onNodesChange } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
    })

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  const handleNodeLabelChange = useCallback(
    (nodeId: string, label: string) => {
      const currentNode = nodesRef.current.find((node) => node.id === nodeId)

      if (!currentNode || currentNode.data.label === label) {
        return
      }

      const change: NodeChange<CanvasNode> = {
        id: nodeId,
        type: "replace",
        item: {
          ...currentNode,
          data: {
            ...currentNode.data,
            label,
          },
        },
      }

      onNodesChange([change])
    },
    [onNodesChange],
  )

  const handleNodeColorChange = useCallback(
    (nodeId: string, color: CanvasNodeColor) => {
      const currentNode = nodesRef.current.find((node) => node.id === nodeId)

      if (!currentNode || currentNode.data.color === color) {
        return
      }

      const change: NodeChange<CanvasNode> = {
        id: nodeId,
        type: "replace",
        item: {
          ...currentNode,
          data: {
            ...currentNode.data,
            color,
          },
        },
      }

      onNodesChange([change])
    },
    [onNodesChange],
  )

  const handleEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      const currentEdge = edgesRef.current.find((edge) => edge.id === edgeId)
      const currentLabel = currentEdge?.data?.label ?? ""

      if (!currentEdge || currentLabel === label) {
        return
      }

      const change: EdgeChange<CanvasEdge> = {
        id: edgeId,
        type: "replace",
        item: {
          ...currentEdge,
          data: {
            ...(currentEdge.data ?? {}),
            label,
          },
        },
      }

      onEdgesChange([change])
    },
    [onEdgesChange],
  )

  const handleConnect = useCallback<OnConnect>(
    (connection) => {
      const [newEdge] = addEdge<CanvasEdge>(
        {
          ...connection,
          type: CANVAS_EDGE_TYPE,
          data: {
            label: "",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "var(--text-primary)",
          },
          interactionWidth: 28,
        },
        [],
      )

      if (!newEdge) {
        return
      }

      onEdgesChange([
        {
          type: "add",
          item: newEdge,
          index: edgesRef.current.length,
        },
      ])
    },
    [onEdgesChange],
  )

  const nodeTypes = useMemo(
    () => ({
      [CANVAS_NODE_TYPE]: (props: NodeProps<CanvasNode>) => (
        <CanvasNodeComponent
          {...props}
          onColorChange={handleNodeColorChange}
          onLabelChange={handleNodeLabelChange}
        />
      ),
    }),
    [handleNodeColorChange, handleNodeLabelChange],
  )

  const edgeTypes = useMemo(
    () => ({
      [CANVAS_EDGE_TYPE]: (props: EdgeProps<CanvasEdge>) => (
        <CanvasEdgeComponent {...props} onLabelChange={handleEdgeLabelChange} />
      ),
    }),
    [handleEdgeLabelChange],
  )

  const defaultEdgeOptions = useMemo<DefaultEdgeOptions>(
    () => ({
      type: CANVAS_EDGE_TYPE,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "var(--text-primary)",
      },
      interactionWidth: 28,
    }),
    [],
  )

  useEffect(() => {
    if (!isDraggingShape) {
      return
    }

    function handleWindowDragOver(event: DragEvent) {
      if (
        !event.dataTransfer ||
        !Array.from(event.dataTransfer.types).includes(SHAPE_DRAG_MIME_TYPE)
      ) {
        return
      }

      setDragPreview((currentPreview) =>
        currentPreview
          ? {
              ...currentPreview,
              cursorX: event.clientX,
              cursorY: event.clientY,
            }
          : currentPreview,
      )
    }

    function clearDragPreview() {
      setDragPreview(null)
    }

    window.addEventListener("dragover", handleWindowDragOver)
    window.addEventListener("drop", clearDragPreview)
    window.addEventListener("dragend", clearDragPreview)

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver)
      window.removeEventListener("drop", clearDragPreview)
      window.removeEventListener("dragend", clearDragPreview)
    }
  }, [isDraggingShape])

  return (
    <div
      className="relative h-full w-full"
      onDragOver={(event) => {
        if (
          !Array.from(event.dataTransfer.types).includes(SHAPE_DRAG_MIME_TYPE)
        ) {
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
        setDragPreview(null)

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
        onConnect={handleConnect}
        onDelete={onDelete}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance
        }}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-base"
        defaultEdgeOptions={defaultEdgeOptions}
        edgeTypes={edgeTypes}
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
      {dragPreview ? (
        <div
          className="pointer-events-none fixed left-0 top-0 z-20 opacity-90"
          style={{
            transform: `translate(${dragPreview.cursorX - dragPreview.payload.width / 2}px, ${dragPreview.cursorY - dragPreview.payload.height / 2}px)`,
          }}
        >
          <CanvasShape
            color={DEFAULT_NODE_COLOR}
            shape={dragPreview.payload.shape}
            width={dragPreview.payload.width}
            height={dragPreview.payload.height}
            label={<span className="text-sm font-medium leading-5 tracking-tight"> </span>}
          />
        </div>
      ) : null}
      <ShapePanel
        onDragStart={(payload, cursorPosition) => {
          setDragPreview({
            payload,
            cursorX: cursorPosition.x,
            cursorY: cursorPosition.y,
          })
        }}
        onDragEnd={() => {
          setDragPreview(null)
        }}
      />
    </div>
  )
}
