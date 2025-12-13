/**
 * Tag Helper Utilities
 *
 * Provides helper functions for working with MangaDex tags,
 * including display name conversion and grouping.
 */

import { TagList, TagGroups } from '@renderer/constants/tag-list.constant'

/**
 * Convert camelCase tag key to display name
 * Examples: SciFi -> Sci-Fi, BoysLove -> Boys' Love
 */
export function getTagDisplayName(tagKey: string): string {
  const specialCases: Record<string, string> = {
    SciFi: 'Sci-Fi',
    BoysLove: "Boys' Love",
    GirlsLove: "Girls' Love",
    FourKoma: '4-Koma',
    WebComic: 'Web Comic'
  }

  if (specialCases[tagKey]) {
    return specialCases[tagKey]
  }

  // Insert space before capital letters (except first)
  return tagKey.replaceAll(/([A-Z])/g, ' $1').trim()
}

/**
 * Get tag ID by display name or key
 */
export function getTagId(tagKeyOrName: string): string | undefined {
  return TagList[tagKeyOrName as keyof typeof TagList]
}

/**
 * Get tag key by ID
 */
export function getTagKeyById(tagId: string): string | undefined {
  return Object.entries(TagList).find(([, id]) => id === tagId)?.[0]
}

/**
 * Get all tags for a specific group with display names
 */
export function getTagsByGroup(group: keyof typeof TagGroups): Array<{
  id: string
  key: string
  name: string
}> {
  return TagGroups[group].map((key) => ({
    id: TagList[key as keyof typeof TagList],
    key,
    name: getTagDisplayName(key)
  }))
}

/**
 * Get all tags organized by group
 */
export function getAllTagsGrouped(): Record<
  string,
  Array<{ id: string; key: string; name: string }>
> {
  return {
    Genre: getTagsByGroup('genre'),
    Theme: getTagsByGroup('theme'),
    Format: getTagsByGroup('format'),
    Content: getTagsByGroup('content')
  }
}
