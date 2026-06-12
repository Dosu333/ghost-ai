"use client"

import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
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
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense"

import { CanvasControlBar } from "@/components/editor/canvas-control-bar"
import { CanvasEdgeComponent } from "@/components/editor/canvas-edge"
import { CanvasNodeComponent } from "@/components/editor/canvas-node"
import { CanvasPresenceOverlay } from "@/components/editor/canvas-presence-overlay"
import { CanvasShape } from "@/components/editor/canvas-shape"
import { ShapePanel } from "@/components/editor/shape-panel"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
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
import type {
  CanvasLoadResponse,
  CanvasSaveStatus,
  CanvasSnapshot,
} from "@/types/canvas-persistence"

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

function getEventClientPosition(
  event:
    | MouseEvent
    | TouchEvent
    | ReactMouseEvent<HTMLDivElement>
    | ReactMouseEvent<Element>
) {
  if ("touches" in event) {
    const touch = event.touches[0] ?? event.changedTouches[0]

    if (!touch) {
      return null
    }

    return {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  return {
    x: event.clientX,
    y: event.clientY,
  }
}

interface DragPreviewState {
  cursorX: number
  cursorY: number
  payload: CanvasShapeDragPayload
}

const VIEWPORT_ANIMATION_DURATION_MS = 180

interface EditorCanvasProps {
  initialCanvasJsonPath?: string | null
  onSaveStatusChange?: (status: CanvasSaveStatus) => void
  projectId: string
  saveRequestId?: number
  templateImportRequest?: {
    requestId: number
    template: CanvasTemplate
  } | null
}

export function EditorCanvas({
  initialCanvasJsonPath = null,
  onSaveStatusChange,
  projectId,
  saveRequestId = 0,
  templateImportRequest = null,
}: EditorCanvasProps) {
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null)
  const nodeIdCounterRef = useRef(0)
  const nodesRef = useRef<CanvasNode[]>([])
  const edgesRef = useRef<CanvasEdge[]>([])
  const reactFlowInstanceRef =
    useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const hasAttemptedSavedCanvasLoadRef = useRef(false)
  const lastImportedTemplateRequestIdRef = useRef<number | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null)
  const [isAutosaveEnabled, setIsAutosaveEnabled] = useState(false)
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const [viewportVersion, setViewportVersion] = useState(0)
  const isDraggingShape = dragPreview !== null
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const updateMyPresence = useUpdateMyPresence()
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
  const { saveNow, syncBaseline } = useCanvasAutosave(nodes, edges, {
    enabled: isAutosaveEnabled,
    onStatusChange: onSaveStatusChange,
    projectId,
  })

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  const replaceCanvasSnapshot = useCallback(
    (snapshot: CanvasSnapshot) => {
      const currentEdges = edgesRef.current
      const currentNodes = nodesRef.current

      if (currentEdges.length > 0) {
        onEdgesChange(
          currentEdges.map((edge) => ({
            id: edge.id,
            type: "remove" as const,
          }))
        )
      }

      if (currentNodes.length > 0) {
        onNodesChange(
          currentNodes.map((node) => ({
            id: node.id,
            type: "remove" as const,
          }))
        )
      }

      if (snapshot.nodes.length > 0) {
        onNodesChange(
          snapshot.nodes.map((node, index) => ({
            type: "add" as const,
            item: node,
            index,
          }))
        )
      }

      if (snapshot.edges.length > 0) {
        onEdgesChange(
          snapshot.edges.map((edge, index) => ({
            type: "add" as const,
            item: edge,
            index,
          }))
        )
      }
    },
    [onEdgesChange, onNodesChange]
  )

  useEffect(() => {
    if (saveRequestId === 0) {
      return
    }

    saveNow()
  }, [saveNow, saveRequestId])

  useEffect(() => {
    if (hasAttemptedSavedCanvasLoadRef.current) {
      return
    }

    if (!reactFlowInstance) {
      return
    }

    if (nodes.length > 0 || edges.length > 0) {
      hasAttemptedSavedCanvasLoadRef.current = true
      setIsAutosaveEnabled(true)
      return
    }

    if (!initialCanvasJsonPath) {
      hasAttemptedSavedCanvasLoadRef.current = true
      setIsAutosaveEnabled(true)
      return
    }

    hasAttemptedSavedCanvasLoadRef.current = true

    let isCancelled = false

    void (async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Canvas load failed.")
        }

        const body = (await response.json()) as CanvasLoadResponse
        const canvas = body.canvas

        if (isCancelled || !canvas) {
          return
        }

        if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
          return
        }

        syncBaseline(canvas)
        replaceCanvasSnapshot(canvas)

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            void reactFlowInstanceRef.current?.fitView({
              duration: VIEWPORT_ANIMATION_DURATION_MS,
              padding: 0.18,
            })
          })
        })
      } catch {
        // Keep the room usable even if the saved snapshot can't be restored.
      } finally {
        if (!isCancelled) {
          setIsAutosaveEnabled(true)
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [
    edges.length,
    initialCanvasJsonPath,
    nodes.length,
    projectId,
    reactFlowInstance,
    replaceCanvasSnapshot,
    syncBaseline,
  ])

  useEffect(() => {
    if (!templateImportRequest) {
      return
    }

    if (lastImportedTemplateRequestIdRef.current === templateImportRequest.requestId) {
      return
    }

    lastImportedTemplateRequestIdRef.current = templateImportRequest.requestId

    replaceCanvasSnapshot({
      edges: templateImportRequest.template.edges,
      nodes: templateImportRequest.template.nodes,
    })

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        void reactFlowInstanceRef.current?.fitView({
          duration: VIEWPORT_ANIMATION_DURATION_MS,
          padding: 0.18,
        })
      })
    })
  }, [replaceCanvasSnapshot, templateImportRequest])

  const handleZoomIn = useCallback(() => {
    void reactFlowInstance?.zoomIn({
      duration: VIEWPORT_ANIMATION_DURATION_MS,
    })
  }, [reactFlowInstance])

  const handleZoomOut = useCallback(() => {
    void reactFlowInstance?.zoomOut({
      duration: VIEWPORT_ANIMATION_DURATION_MS,
    })
  }, [reactFlowInstance])

  const handleFitView = useCallback(() => {
    void reactFlowInstance?.fitView({
      duration: VIEWPORT_ANIMATION_DURATION_MS,
    })
  }, [reactFlowInstance])

  const handleUndo = useCallback(() => {
    if (!canUndo) {
      return
    }

    undo()
  }, [canUndo, undo])

  const handleRedo = useCallback(() => {
    if (!canRedo) {
      return
    }

    redo()
  }, [canRedo, redo])

  useKeyboardShortcuts({
    reactFlow: reactFlowInstance,
    onUndo: handleUndo,
    onRedo: handleRedo,
  })

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

  useEffect(() => {
    return () => {
      updateMyPresence({ cursor: null })
    }
  }, [updateMyPresence])

  const updatePresenceCursor = useCallback(
    (clientX: number, clientY: number) => {
      const instance = reactFlowInstanceRef.current

      if (!instance) {
        return
      }

      const flowPosition = instance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      })

      updateMyPresence({
        cursor: flowPosition,
      })
    },
    [updateMyPresence],
  )

  const handleCanvasMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const position = getEventClientPosition(event)

      if (!position) {
        return
      }

      updatePresenceCursor(position.x, position.y)
    },
    [updatePresenceCursor],
  )

  const handleCanvasMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const handleNodeDrag = useCallback(
    (event: MouseEvent | TouchEvent, _node: CanvasNode) => {
      const position = getEventClientPosition(event)

      if (!position) {
        return
      }

      updatePresenceCursor(position.x, position.y)
    },
    [updatePresenceCursor],
  )

  const handleSelectionDrag = useCallback(
    (event: ReactMouseEvent<Element>, _nodes: CanvasNode[]) => {
      const position = getEventClientPosition(event)

      if (!position) {
        return
      }

      updatePresenceCursor(position.x, position.y)
    },
    [updatePresenceCursor],
  )

  const handleViewportMove = useCallback(() => {
    setViewportVersion((currentVersion) => currentVersion + 1)
  }, [])

  return (
    <div
      ref={canvasWrapperRef}
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
          setReactFlowInstance(instance)
        }}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        onNodeDrag={handleNodeDrag}
        onSelectionDrag={handleSelectionDrag}
        onMove={handleViewportMove}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        className="bg-base"
        defaultEdgeOptions={defaultEdgeOptions}
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
      >
        <Background
          color="var(--border-default)"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
      </ReactFlow>
      <CanvasPresenceOverlay
        canvasElement={canvasWrapperRef.current}
        reactFlowInstance={reactFlowInstance}
        viewportVersion={viewportVersion}
      />
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
      <CanvasControlBar
        canRedo={canRedo}
        canUndo={canUndo}
        onFitView={handleFitView}
        onRedo={handleRedo}
        onUndo={handleUndo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
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
