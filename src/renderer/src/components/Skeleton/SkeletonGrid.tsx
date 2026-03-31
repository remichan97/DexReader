import './Skeleton.css'

export interface SkeletonGridProps {
  /**
   * Number of skeleton cards to display
   * @default 12
   */
  count?: number

  /**
   * Minimum card width
   * @default '180px'
   */
  minCardWidth?: string

  /**
   * Gap between cards
   * @default '16px'
   */
  gap?: string

  /**
   * Additional CSS class
   */
  className?: string
}

/**
 * SkeletonGrid component for manga card grid loading state
 *
 * @example
 * ```tsx
 * <SkeletonGrid count={12} />
 * <SkeletonGrid count={8} minCardWidth="200px" gap="20px" />
 * ```
 */
export function SkeletonGrid({
  count = 12,
  minCardWidth = '180px',
  gap = '16px',
  className = ''
}: SkeletonGridProps): React.JSX.Element {
  const style: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`,
    gap
  }

  return (
    <div className={`skeleton-grid ${className}`.trim()} style={style} role="status" aria-busy>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-card" aria-hidden="true">
          <div className="skeleton-card__cover" />
          <div className="skeleton-card__content">
            <div className="skeleton skeleton--text" style={{ width: '100%' }} />
            <div className="skeleton skeleton--text" style={{ width: '60%' }} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading manga...</span>
    </div>
  )
}
