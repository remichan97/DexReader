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
  /**
   * Whether to collect and return results from each operation.
   * - When true: All results (including undefined) are collected and returned
   * - When false/undefined: Returns empty array (optimized for void operations)
   * @default false
   */
  collectResults?: boolean
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
 * **Result collection:**
 * - Set `collectResults: true` to collect and return all operation results (including undefined)
 * - Leave undefined for void operations to avoid unnecessary array allocations
 *
 * **Example usage:**
 * ```typescript
 * // Pattern B: Complex per-item logic (void operation)
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
 * // Pattern C: Operations that return values
 * const results = executeBatchOperations({
 *   commands: fetchCommands,
 *   db: this.db,
 *   collectResults: true, // Enable result collection
 *   singleOperation: (cmd) => this.fetchItem(cmd),
 *   batchOperation: (tx, cmd) => {
 *     return tx.select().from(table).where(eq(table.id, cmd.id)).get()
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
 * @returns Array of results when collectResults=true, empty array otherwise
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
    // Only collect results if explicitly requested
    if (options.collectResults) {
      return [result]
    }
    // For void operations, return empty array
    return []
  }

  // Batch operation within transaction
  // Only allocate results array if collection is requested
  if (options.collectResults) {
    const results: TResult[] = []
    options.db.transaction((txn) => {
      for (const command of options.commands) {
        const result = options.batchOperation(txn, command)
        results.push(result)
      }
    })
    return results
  }

  // Void operations - no result collection needed
  options.db.transaction((txn) => {
    for (const command of options.commands) {
      options.batchOperation(txn, command)
    }
  })
  return []
}
