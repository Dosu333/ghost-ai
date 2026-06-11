"use client"

import { type CSSProperties, type ReactNode } from "react"

import { getNodeColorPair, type CanvasNodeColor, type CanvasNodeShape } from "@/types/canvas"

interface CanvasShapeProps {
  color: CanvasNodeColor
  height: number
  label?: ReactNode
  labelClassName?: string
  selected?: boolean
  shape: CanvasNodeShape
  width: number
}

const SHAPE_STROKE_WIDTH = 1.5

function getShapeBorderColor(selected: boolean) {
  return selected ? "var(--accent-primary)" : "var(--border-subtle)"
}

function SvgShape({
  children,
}: {
  children: ReactNode
}) {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {children}
    </svg>
  )
}

function DiamondShape({
  backgroundColor,
  borderColor,
}: {
  backgroundColor: string
  borderColor: string
}) {
  return (
    <SvgShape>
      <polygon
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth={SHAPE_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
        points="50,4 96,50 50,96 4,50"
      />
    </SvgShape>
  )
}

function HexagonShape({
  backgroundColor,
  borderColor,
}: {
  backgroundColor: string
  borderColor: string
}) {
  return (
    <SvgShape>
      <polygon
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth={SHAPE_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
        points="20,6 80,6 96,50 80,94 20,94 4,50"
      />
    </SvgShape>
  )
}

function CylinderShape({
  backgroundColor,
  borderColor,
}: {
  backgroundColor: string
  borderColor: string
}) {
  return (
    <SvgShape>
      <rect
        x="10"
        y="16"
        width="80"
        height="68"
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth={SHAPE_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="50"
        cy="16"
        rx="40"
        ry="12"
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth={SHAPE_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="50"
        cy="84"
        rx="40"
        ry="12"
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth={SHAPE_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
      />
    </SvgShape>
  )
}

function getShapeBorderRadius(shape: CanvasNodeShape) {
  if (shape === "circle" || shape === "pill") {
    return "9999px"
  }

  if (shape === "rectangle") {
    return "1rem"
  }

  return undefined
}

function renderShapeSvg(
  shape: CanvasNodeShape,
  backgroundColor: string,
  borderColor: string,
) {
  switch (shape) {
    case "diamond":
      return (
        <DiamondShape
          backgroundColor={backgroundColor}
          borderColor={borderColor}
        />
      )
    case "hexagon":
      return (
        <HexagonShape
          backgroundColor={backgroundColor}
          borderColor={borderColor}
        />
      )
    case "cylinder":
      return (
        <CylinderShape
          backgroundColor={backgroundColor}
          borderColor={borderColor}
        />
      )
    default:
      return null
  }
}

export function CanvasShape({
  color,
  height,
  label,
  labelClassName,
  selected = false,
  shape,
  width,
}: CanvasShapeProps) {
  const colorPair = getNodeColorPair(color)
  const borderColor = getShapeBorderColor(selected)
  const isCssShape =
    shape === "rectangle" || shape === "circle" || shape === "pill"

  const containerStyle: CSSProperties = {
    width,
    height,
    color: colorPair.text,
  }

  const cssShapeStyle: CSSProperties = isCssShape
    ? {
        backgroundColor: colorPair.background,
        borderColor,
        borderRadius: getShapeBorderRadius(shape),
      }
    : {}

  return (
    <div className="relative" style={containerStyle}>
      {isCssShape ? (
        <div
          className="absolute inset-0 border shadow-lg shadow-black/20"
          style={cssShapeStyle}
        />
      ) : (
        renderShapeSvg(shape, colorPair.background, borderColor)
      )}

      <div
        className={`absolute inset-0 flex items-center justify-center px-5 py-4 text-center ${labelClassName ?? "pointer-events-none"}`}
      >
        {label}
      </div>
    </div>
  )
}
