'use client';

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable'

export type Offset = { x: number; y: number }
export type LayoutOffsets = Record<string, Offset>
export type HiddenLayers = Record<string, boolean>
/** Height deltas (canvas px) for resizable layers. */
export type LayerSizes = Record<string, number>
export type AlignGuides = { v: number | null; h: number | null }

/** How close (canvas px) an element's centre must be to a guide to show/snap. */
const SNAP = 12
const MIN_PANEL_HEIGHT = 80

type DesignContextValue = {
  active: boolean
  scale: number
  offsets: LayoutOffsets
  hidden: HiddenLayers
  sizes: LayerSizes
  onMove: (id: string, offset: Offset) => void
  onResize: (id: string, dh: number) => void
  onGuides: (guides: AlignGuides) => void
}

const DesignContext = createContext<DesignContextValue>({
  active: false,
  scale: 1,
  offsets: {},
  hidden: {},
  sizes: {},
  onMove: () => {},
  onResize: () => {},
  onGuides: () => {},
})

export function DesignProvider({
  active,
  scale,
  offsets,
  hidden,
  sizes,
  onMove,
  onResize,
  onGuides,
  children,
}: {
  active: boolean
  scale: number
  offsets: LayoutOffsets
  hidden?: HiddenLayers
  sizes?: LayerSizes
  onMove: (id: string, offset: Offset) => void
  onResize?: (id: string, dh: number) => void
  onGuides?: (guides: AlignGuides) => void
  children: ReactNode
}) {
  return (
    <DesignContext.Provider
      value={{
        active,
        scale,
        offsets,
        hidden: hidden ?? {},
        sizes: sizes ?? {},
        onMove,
        onResize: onResize ?? (() => {}),
        onGuides: onGuides ?? (() => {}),
      }}
    >
      {children}
    </DesignContext.Provider>
  )
}

function mergeTranslate(existing: string | undefined, offset: Offset): string {
  const t = `translate(${offset.x}px, ${offset.y}px)`
  return existing ? `${existing} ${t}` : t
}

/**
 * Centre of the dragged block in unscaled canvas coordinates. For full-canvas
 * layers, measure the visible child instead (the layer itself always spans the
 * whole canvas, which would falsely report "centred").
 */
function canvasCentre(node: HTMLElement) {
  const stage = node.closest('.stage-canvas') as HTMLElement | null
  if (!stage) return null
  const target = node.classList.contains('movable-layer')
    ? ((node.firstElementChild as HTMLElement) ?? node)
    : node
  const nr = target.getBoundingClientRect()
  const sr = stage.getBoundingClientRect()
  const sc = sr.width / stage.offsetWidth
  return {
    cx: (nr.x + nr.width / 2 - sr.x) / sc,
    cy: (nr.y + nr.height / 2 - sr.y) / sc,
    w: stage.offsetWidth,
    h: stage.offsetHeight,
  }
}

function ResizeHandle({ id, minDh }: { id: string; minDh: number }) {
  const { scale, sizes, onResize } = useContext(DesignContext)
  // Track clientY ourselves: the handle rides the panel's top edge, so any
  // parent-relative delta (e.g. DraggableCore's) feeds back as the panel grows.
  const drag = useRef<{ startY: number; startDh: number } | null>(null)
  return (
    <div
      className="resize-handle"
      title="Drag to resize"
      // Keep the panel's Draggable from also starting a move.
      onMouseDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        drag.current = { startY: e.clientY, startDh: sizes[id] ?? 0 }
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* synthetic events have no active pointer */
        }
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        // Panel is bottom-anchored: dragging the top edge up grows the panel.
        const dh = drag.current.startDh + (drag.current.startY - e.clientY) / scale
        onResize(id, Math.max(minDh, dh))
      }}
      onPointerUp={(e) => {
        drag.current = null
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }}
    />
  )
}

interface MovableProps {
  id: string
  children: ReactNode
  /** Show a top-edge handle that adjusts the block's height (bottom-anchored). */
  resizableHeight?: boolean
}

/** Wraps a single positioned root; applies drag offset / visibility / size without breaking layout. */
export function Movable({ id, children, resizableHeight }: MovableProps) {
  const { active, scale, offsets, hidden, sizes, onMove, onGuides } = useContext(DesignContext)
  const nodeRef = useRef<HTMLDivElement>(null)
  const offset = offsets[id] ?? { x: 0, y: 0 }
  const isHidden = !!hidden[id]
  const dh = sizes[id] ?? 0

  if (!isValidElement(children)) return <>{children}</>

  const child = Children.only(children) as ReactElement<{
    style?: CSSProperties
    className?: string
    children?: ReactNode
  }>

  const baseHeight = typeof child.props.style?.height === 'number' ? child.props.style.height : null
  const heightStyle =
    dh !== 0 && baseHeight !== null
      ? { height: Math.max(MIN_PANEL_HEIGHT, baseHeight + dh) }
      : {}

  if (!active) {
    if (!isHidden && dh === 0 && offset.x === 0 && offset.y === 0) return child
    return cloneElement(child, {
      style: {
        ...child.props.style,
        ...(offset.x !== 0 || offset.y !== 0
          ? { transform: mergeTranslate(child.props.style?.transform, offset) }
          : {}),
        ...(isHidden ? { visibility: 'hidden' as const } : {}),
        ...heightStyle,
      },
    })
  }

  const updateGuides = () => {
    const node = nodeRef.current
    const c = node && canvasCentre(node)
    if (!c) return
    onGuides({
      v: Math.abs(c.cx - c.w / 2) <= SNAP ? c.w / 2 : null,
      h: Math.abs(c.cy - c.h / 2) <= SNAP ? c.h / 2 : null,
    })
  }

  const commit = (data: DraggableData) => {
    let { x, y } = data
    const node = nodeRef.current
    const c = node && canvasCentre(node)
    if (c) {
      // Snap to canvas centre on drop when within threshold.
      if (Math.abs(c.cx - c.w / 2) <= SNAP) x += c.w / 2 - c.cx
      if (Math.abs(c.cy - c.h / 2) <= SNAP) y += c.h / 2 - c.cy
    }
    onGuides({ v: null, h: null })
    onMove(id, { x, y })
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      scale={scale}
      position={offset}
      // Nested movables (e.g. contact strip inside the gold panel): stop the
      // event so the inner block drags without also dragging its parent.
      onStart={(e: DraggableEvent) => {
        e.stopPropagation()
      }}
      onDrag={updateGuides}
      onStop={(_e: DraggableEvent, data: DraggableData) => commit(data)}
    >
      {cloneElement(
        child,
        {
          ref: nodeRef,
          className: [child.props.className, 'movable-active'].filter(Boolean).join(' '),
          style: {
            ...child.props.style,
            ...(isHidden ? { visibility: 'hidden' as const } : {}),
            ...heightStyle,
          },
        } as HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLDivElement> },
        <>
          {child.props.children}
          {resizableHeight && baseHeight !== null && (
            <ResizeHandle id={id} minDh={MIN_PANEL_HEIGHT - baseHeight} />
          )}
        </>,
      )}
    </Draggable>
  )
}

/** Full-canvas layer for multi-root blocks or components that can't take a ref. */
export function MovableLayer({ id, children }: MovableProps) {
  return (
    <Movable id={id}>
      <div className="movable-layer">{children}</div>
    </Movable>
  )
}
