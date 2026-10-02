import { executeBatchOperations } from './batch-operations.util'

const TX_MARKER = 'tx-marker'

function mockDb(): { transaction: ReturnType<typeof vi.fn> } {
  return { transaction: vi.fn((cb: (tx: unknown) => void) => cb(TX_MARKER)) }
}

describe('executeBatchOperations', () => {
  it('returns an empty array without touching the db when there are no commands', () => {
    const db = mockDb()
    const singleOperation = vi.fn()
    const batchOperation = vi.fn()

    const result = executeBatchOperations({
      commands: [],
      db: db as never,
      singleOperation,
      batchOperation
    })

    expect(result).toEqual([])
    expect(db.transaction).not.toHaveBeenCalled()
    expect(singleOperation).not.toHaveBeenCalled()
    expect(batchOperation).not.toHaveBeenCalled()
  })

  it('uses singleOperation (not a transaction) for exactly one command', () => {
    const db = mockDb()
    const singleOperation = vi.fn()
    const batchOperation = vi.fn()

    executeBatchOperations({
      commands: ['cmd-1'],
      db: db as never,
      singleOperation,
      batchOperation
    })

    expect(singleOperation).toHaveBeenCalledWith('cmd-1')
    expect(batchOperation).not.toHaveBeenCalled()
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('returns an empty array for a single command when collectResults is not set', () => {
    const db = mockDb()

    const result = executeBatchOperations({
      commands: ['cmd-1'],
      db: db as never,
      singleOperation: () => 'result',
      batchOperation: () => 'result'
    })

    expect(result).toEqual([])
  })

  it('wraps the single-command result in an array when collectResults is true', () => {
    const db = mockDb()

    const result = executeBatchOperations({
      commands: ['cmd-1'],
      db: db as never,
      collectResults: true,
      singleOperation: () => 'single-result',
      batchOperation: () => 'batch-result'
    })

    expect(result).toEqual(['single-result'])
  })

  it('runs batchOperation for every command inside a single transaction when there are multiple commands', () => {
    const db = mockDb()
    const batchOperation = vi.fn()

    executeBatchOperations({
      commands: ['cmd-1', 'cmd-2', 'cmd-3'],
      db: db as never,
      singleOperation: vi.fn(),
      batchOperation
    })

    expect(db.transaction).toHaveBeenCalledTimes(1)
    expect(batchOperation).toHaveBeenCalledTimes(3)
    expect(batchOperation).toHaveBeenNthCalledWith(1, TX_MARKER, 'cmd-1')
    expect(batchOperation).toHaveBeenNthCalledWith(2, TX_MARKER, 'cmd-2')
    expect(batchOperation).toHaveBeenNthCalledWith(3, TX_MARKER, 'cmd-3')
  })

  it('returns an empty array for multiple commands when collectResults is not set', () => {
    const db = mockDb()

    const result = executeBatchOperations({
      commands: ['cmd-1', 'cmd-2'],
      db: db as never,
      singleOperation: vi.fn(),
      batchOperation: () => 'ignored'
    })

    expect(result).toEqual([])
  })

  it('collects every batchOperation result, in command order, when collectResults is true', () => {
    const db = mockDb()

    const result = executeBatchOperations({
      commands: ['cmd-1', 'cmd-2', 'cmd-3'],
      db: db as never,
      collectResults: true,
      singleOperation: vi.fn(),
      batchOperation: (_tx, cmd: string) => `result-for-${cmd}`
    })

    expect(result).toEqual(['result-for-cmd-1', 'result-for-cmd-2', 'result-for-cmd-3'])
  })
})
