import { databaseConnection } from '../connection'

type DatabaseType = ReturnType<typeof databaseConnection.getDb>
// Extract the transaction type from the database's transaction method
type TransactionCallback = Parameters<DatabaseType['transaction']>[0]
type TransactionType = Parameters<TransactionCallback>[0]

/**
 * Configuration for batch operation execution
 * @template TCommand - The type of command object being processed
 * @template TResult - The return type of each operation (use void for operations without return values)
 */
export type BatchCommand<TCommand, TResult> = {
  /** Array of commands to process */
  commands: TCommand[]
  /** Database connection instance */
  db: DatabaseType
  /** Single operation handler - called when only one command exists */
  singleOperation: (command: TCommand) => TResult
  /** Batch operation handler - called for each command within a transaction */
  batchOperation: (tx: TransactionType, command: TCommand) => TResult
}

/**
 * Executes batch operations with standard optimizations (empty check, single-item optimization, transaction wrapper)
 *
 * **When to use this utility:**
 * - Complex per-item logic (conditional operations, different values per item)
 * - INSERT operations with varying data
 * - Operations that can't be expressed as a single SQL WHERE IN clause
 *
 * **When NOT to use (use inArray instead):**
 * - Simple bulk UPDATE/DELETE where all items get identical treatment
 * - Only IDs vary (e.g., `UPDATE table SET field=value WHERE id IN (...)`)
 * - No conditional logic per item
 *
 * **Example usage:**
 * ```typescript
 * // Pattern B: Complex per-item logic
 * executeBatchOperations({
 *   commands: deleteCommands,
 *   db: this.db,
 *   singleOperation: (cmd) => this.deleteDownload(cmd),
 *   batchOperation: (tx, cmd) => {
 *     if (cmd.isDeletePermanent) {
 *       tx.delete(table).where(eq(table.id, cmd.id)).run()
 *     } else {
 *       tx.update(table).set({ isHidden: true }).where(eq(table.id, cmd.id)).run()
 *     }
 *   }
 * })
 *
 * // Pattern A: Use inArray instead (much faster)
 * this.db
 *   .update(table)
 *   .set({ field: value })
 *   .where(inArray(table.id, ids))
 *   .run()
 * ```
 *
 * @template TCommand - Command object type
 * @template TResult - Return type (defaults to void for operations without return values)
 * @param options - Batch operation configuration
 * @returns Array of results (empty array for void operations or empty input)
 */
export function executeBatchOperations<TCommand, TResult = void>(
  options: BatchCommand<TCommand, TResult>
): TResult[] {
  // Empty array handling
  if (options.commands.length === 0) {
    return []
  }

  // Single item optimization - use single operation for better performance
  if (options.commands.length === 1) {
    const result = options.singleOperation(options.commands[0])
    // Handle void return type
    return result === undefined ? ([] as TResult[]) : ([result] as TResult[])
  }

  // Batch operation within transaction
  const results: TResult[] = []

  options.db.transaction((txn) => {
    for (const command of options.commands) {
      const result = options.batchOperation(txn, command)
      // Only push non-void results
      if (result !== undefined) {
        results.push(result)
      }
    }
  })

  return results
}
