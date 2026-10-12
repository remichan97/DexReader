/**
 * Remembers which route opened a manga's detail page, so its Back button can return there
 * instead of always landing on Browse. The origin travels in react-router `location.state`
 * (`{ from }`): views that link to a detail page attach it, the detail page forwards it to
 * the reader, and the reader hands it back when returning to the detail page.
 */

export interface NavigationOriginState {
  readonly from: string
}

interface RouteLocation {
  readonly pathname: string
  readonly search: string
}

/** Router state that records `location` as the origin of the navigation. */
export function originFrom(location: RouteLocation): NavigationOriginState {
  return { from: `${location.pathname}${location.search}` }
}

/** Router state that carries an already-known origin forward (empty when there is none). */
export function forwardOrigin(origin: string | undefined): Partial<NavigationOriginState> {
  return origin ? { from: origin } : {}
}

/** Reads the origin route out of `location.state`, if one was recorded. */
export function getOrigin(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return undefined
  }
  const { from } = state
  return typeof from === 'string' && from.startsWith('/') ? from : undefined
}
