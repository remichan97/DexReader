import { isBackupLockHeld, releaseBackupLock, tryAcquireBackupLock } from './backupOperationLock'

afterEach(() => {
  releaseBackupLock()
})

describe('backupOperationLock', () => {
  it('is free until something acquires it', () => {
    expect(isBackupLockHeld()).toBe(false)
  })

  it('grants the lock to the first caller only', () => {
    expect(tryAcquireBackupLock()).toBe(true)
    expect(tryAcquireBackupLock()).toBe(false)
    expect(isBackupLockHeld()).toBe(true)
  })

  it('can be acquired again once released', () => {
    tryAcquireBackupLock()
    releaseBackupLock()

    expect(isBackupLockHeld()).toBe(false)
    expect(tryAcquireBackupLock()).toBe(true)
  })

  it('tolerates a release when nothing holds the lock', () => {
    expect(() => releaseBackupLock()).not.toThrow()
    expect(isBackupLockHeld()).toBe(false)
  })
})
