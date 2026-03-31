import { useMemo } from 'react'

/**
 * Generate page pairs for double page mode
 * @param totalPages Total number of pages in chapter
 * @param skipCoverPages Whether to show first page alone
 * @param readRightToLeft Whether to pair pages right-to-left (manga style)
 * @returns Array of page index pairs
 */
function generatePagePairs(
  totalPages: number,
  skipCoverPages: boolean,
  readRightToLeft: boolean
): Array<[number] | [number, number]> {
  const pairs: Array<[number] | [number, number]> = []

  if (totalPages === 0) return pairs

  // First page shown alone if skipCoverPages is true
  if (skipCoverPages) {
    pairs.push([0])

    // Pair remaining pages
    for (let i = 1; i < totalPages; i += 2) {
      if (i + 1 < totalPages) {
        // Two pages available - pair them based on reading direction
        if (readRightToLeft) {
          pairs.push([i + 1, i]) // Right page first (manga standard)
        } else {
          pairs.push([i, i + 1]) // Left page first (western comics)
        }
      } else {
        // Odd page at end, show alone
        pairs.push([i])
      }
    }
  } else {
    // Don't skip cover - pair from the start
    for (let i = 0; i < totalPages; i += 2) {
      if (i + 1 < totalPages) {
        if (readRightToLeft) {
          pairs.push([i + 1, i])
        } else {
          pairs.push([i, i + 1])
        }
      } else {
        pairs.push([i])
      }
    }
  }

  return pairs
}

interface UsePagePairsReturn {
  pagePairs: Array<[number] | [number, number]>
  currentPairIndex: number
  currentPair: [number] | [number, number] | null
}

/**
 * Custom hook for managing page pairs in double page mode
 * Generates page pairs based on total pages and double page settings
 */
export function usePagePairs(
  totalPages: number,
  currentPage: number,
  skipCoverPages: boolean,
  readRightToLeft: boolean,
  enabled: boolean // Only generate pairs when in double page mode
): UsePagePairsReturn {
  // Generate page pairs based on settings
  const pagePairs = useMemo(() => {
    if (!enabled || totalPages === 0) {
      return []
    }
    return generatePagePairs(totalPages, skipCoverPages, readRightToLeft)
  }, [totalPages, skipCoverPages, readRightToLeft, enabled])

  // Find which pair contains the current page
  const currentPairIndex = useMemo(() => {
    if (!enabled || pagePairs.length === 0) {
      return 0
    }
    const pairIndex = pagePairs.findIndex((pair) => pair.includes(currentPage))
    return Math.max(0, pairIndex)
  }, [pagePairs, currentPage, enabled])

  // Get the current pair
  const currentPair = pagePairs.length > 0 ? pagePairs[currentPairIndex] : null

  return {
    pagePairs,
    currentPairIndex,
    currentPair
  }
}
