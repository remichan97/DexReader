/**
 * Single lock shared by every backup import/export flow (DexReader and Mihon/Tachiyomi).
 *
 * The menu can start a backup operation from any view, and nothing stops a second menu pick
 * while the first one is still open or running (an export dialog waiting for options, an
 * import in flight). Both flows write to the same database and show their own dialogs, so
 * only one may be active at a time.
 *
 * This is module state rather than a store: nothing renders from it, it only gates the
 * event listeners.
 */
let locked = false

/**
 * Take the lock.
 *
 * @returns true if the lock was free and is now held by the caller, false if another
 * operation holds it
 */
export function tryAcquireBackupLock(): boolean {
  if (locked) return false

  locked = true
  return true
}

/**
 * Release the lock. Safe to call when it is not held.
 */
export function releaseBackupLock(): void {
  locked = false
}

export function isBackupLockHeld(): boolean {
  return locked
}
