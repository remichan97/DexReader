import { useCallback, useState } from 'react'

type FitMode = 'width' | 'height' | 'actual' | 'custom'

interface UseReaderZoomReturn {
  // Zoom state
  fitMode: FitMode
  zoomLevel: number
  panX: number
  panY: number
  isDragging: boolean
  transformOriginX: number
  transformOriginY: number
  showZoomControls: boolean

  // Zoom functions
  setFitMode: (mode: FitMode) => void
  zoomIn: (originX?: number, originY?: number) => void
  zoomOut: (originX?: number, originY?: number) => void
  resetZoom: () => void
  setZoomLevel: (level: number) => void

  // Pan functions
  setPanX: (x: number) => void
  setPanY: (y: number) => void
  setIsDragging: (dragging: boolean) => void
  setTransformOriginX: (x: number) => void
  setTransformOriginY: (y: number) => void

  // Handlers
  handleWheel: (e: React.WheelEvent<Element>) => void
  onMouseDown: (e: React.MouseEvent<Element>) => void
  onMouseMove: (e: React.MouseEvent<Element>) => void
  onMouseUp: () => void
  toggleZoomControls: () => void
}

/**
 * Custom hook for managing reader zoom and pan functionality
 * Handles zoom levels, fit modes, pan state, and mouse/wheel interactions
 */
export function useReaderZoom(): UseReaderZoomReturn {
  // Zoom state
  const [fitMode, setFitMode] = useState<FitMode>('height')
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [panX, setPanX] = useState<number>(0)
  const [panY, setPanY] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [transformOriginX, setTransformOriginX] = useState<number>(50)
  const [transformOriginY, setTransformOriginY] = useState<number>(50)
  const [showZoomControls, setShowZoomControls] = useState<boolean>(false)

  // Drag state
  const [dragStartX, setDragStartX] = useState<number>(0)
  const [dragStartY, setDragStartY] = useState<number>(0)
  const [dragStartPanX, setDragStartPanX] = useState<number>(0)
  const [dragStartPanY, setDragStartPanY] = useState<number>(0)

  /**
   * Set fit mode and reset zoom/pan
   */
  const updateFitMode = useCallback((mode: FitMode): void => {
    setFitMode(mode)
    if (mode !== 'custom') {
      setZoomLevel(100)
      setPanX(0)
      setPanY(0)
    }
  }, [])

  /**
   * Zoom in by 20% (max 400%)
   */
  const zoomIn = useCallback((originX?: number, originY?: number): void => {
    setZoomLevel((prev) => {
      const newZoom = Math.min(prev * 1.2, 400)
      if (newZoom !== prev) {
        setFitMode('custom')
        if (originX !== undefined && originY !== undefined) {
          setTransformOriginX(originX)
          setTransformOriginY(originY)
        }
      }
      return newZoom
    })
  }, [])

  /**
   * Zoom out by 20% (min 25%)
   */
  const zoomOut = useCallback((originX?: number, originY?: number): void => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev / 1.2, 25)
      if (newZoom !== prev) {
        setFitMode('custom')
        if (originX !== undefined && originY !== undefined) {
          setTransformOriginX(originX)
          setTransformOriginY(originY)
        }
      }
      return newZoom
    })
  }, [])

  /**
   * Reset zoom to 100% with height fit mode
   */
  const resetZoom = useCallback((): void => {
    setFitMode('height')
    setZoomLevel(100)
    setPanX(0)
    setPanY(0)
    setTransformOriginX(50)
    setTransformOriginY(50)
  }, [])

  /**
   * Set custom zoom level
   */
  const updateZoomLevel = useCallback(
    (level: number): void => {
      const clampedLevel = Math.max(25, Math.min(400, level))
      setZoomLevel(clampedLevel)
      if (clampedLevel !== 100 || fitMode === 'custom') {
        setFitMode('custom')
      }
    },
    [fitMode]
  )

  /**
   * Handle mouse wheel for zooming (Ctrl+Wheel)
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent<Element>): void => {
      if (!e.ctrlKey) return

      e.preventDefault()

      const rect = e.currentTarget.getBoundingClientRect()
      const originX = ((e.clientX - rect.left) / rect.width) * 100
      const originY = ((e.clientY - rect.top) / rect.height) * 100

      if (e.deltaY < 0) {
        zoomIn(originX, originY)
      } else {
        zoomOut(originX, originY)
      }
    },
    [zoomIn, zoomOut]
  )

  /**
   * Handle mouse down for panning
   */
  const onMouseDown = useCallback(
    (e: React.MouseEvent<Element>): void => {
      if (fitMode !== 'custom' || zoomLevel <= 100) return

      setIsDragging(true)
      setDragStartX(e.clientX)
      setDragStartY(e.clientY)
      setDragStartPanX(panX)
      setDragStartPanY(panY)
    },
    [fitMode, zoomLevel, panX, panY]
  )

  /**
   * Handle mouse move for panning
   */
  const onMouseMove = useCallback(
    (e: React.MouseEvent<Element>): void => {
      if (!isDragging) return

      const deltaX = e.clientX - dragStartX
      const deltaY = e.clientY - dragStartY

      setPanX(dragStartPanX + deltaX)
      setPanY(dragStartPanY + deltaY)
    },
    [isDragging, dragStartX, dragStartY, dragStartPanX, dragStartPanY]
  )

  /**
   * Handle mouse up to stop panning
   */
  const onMouseUp = useCallback((): void => {
    setIsDragging(false)
  }, [])

  /**
   * Toggle zoom controls visibility
   */
  const toggleZoomControls = useCallback((): void => {
    setShowZoomControls((prev) => !prev)
  }, [])

  return {
    // State
    fitMode,
    zoomLevel,
    panX,
    panY,
    isDragging,
    transformOriginX,
    transformOriginY,
    showZoomControls,

    // Zoom functions
    setFitMode: updateFitMode,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel: updateZoomLevel,

    // Pan functions
    setPanX,
    setPanY,
    setIsDragging,
    setTransformOriginX,
    setTransformOriginY,

    // Handlers
    handleWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    toggleZoomControls
  }
}
