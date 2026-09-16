const showToast = vi.fn()

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('@renderer/stores', () => ({
  useToastStore: { getState: () => ({ show: showToast }) }
}))

describe('settingsPendingWrites', () => {
  let mod: typeof import('./settingsPendingWrites')
  const updateSection = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Module-level Maps/Set (writeTimers, pendingWrites, changeListeners,
    // hasShownRestartLeaveNudge) must not leak between tests.
    vi.resetModules()
    mod = await import('./settingsPendingWrites')
    globalThis.settings = { updateSection } as unknown as typeof globalThis.settings
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('writeSettingsSection', () => {
    it('writes immediately and does not toast on success', async () => {
      updateSection.mockResolvedValue({ success: true })

      await mod.writeSettingsSection('appearance', { theme: 'dark' })

      expect(updateSection).toHaveBeenCalledWith('appearance', { theme: 'dark' })
      expect(showToast).not.toHaveBeenCalled()
    })

    it('shows an error toast and does not throw when the IPC call reports failure', async () => {
      updateSection.mockResolvedValue({ success: false, error: { message: 'nope' } })

      await expect(mod.writeSettingsSection('appearance', {})).resolves.toBeUndefined()

      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error', title: 'Failed to save setting' })
      )
    })

    it('shows an error toast and does not throw when the IPC call rejects', async () => {
      updateSection.mockRejectedValue(new Error('boom'))

      await expect(mod.writeSettingsSection('appearance', {})).resolves.toBeUndefined()

      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }))
    })

    it('notifies subscribers', async () => {
      updateSection.mockResolvedValue({ success: true })
      const listener = vi.fn()
      mod.subscribeToSettingsChange(listener)

      await mod.writeSettingsSection('appearance', {})

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('subscribeToSettingsChange', () => {
    it('stops notifying once unsubscribed', async () => {
      updateSection.mockResolvedValue({ success: true })
      const listener = vi.fn()
      const unsubscribe = mod.subscribeToSettingsChange(listener)
      unsubscribe()

      await mod.writeSettingsSection('appearance', {})

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('restart-leave-nudge tracking', () => {
    it('reports not shown initially', () => {
      expect(mod.hasRestartLeaveNudgeBeenShown()).toBe(false)
    })

    it('reports shown after being marked', () => {
      mod.markRestartLeaveNudgeShown()

      expect(mod.hasRestartLeaveNudgeBeenShown()).toBe(true)
    })

    it('resets back to not-shown after any further settings write', async () => {
      updateSection.mockResolvedValue({ success: true })
      mod.markRestartLeaveNudgeShown()

      await mod.writeSettingsSection('appearance', {})

      expect(mod.hasRestartLeaveNudgeBeenShown()).toBe(false)
    })
  })

  describe('queueSettingsWrite', () => {
    it('debounces multiple writes to the same key into a single commit using the latest value', async () => {
      updateSection.mockResolvedValue({ success: true })

      mod.queueSettingsWrite('accentColor', 'appearance', '#111111', () => true)
      mod.queueSettingsWrite('accentColor', 'appearance', '#222222', () => true)

      await vi.advanceTimersByTimeAsync(500)

      expect(updateSection).toHaveBeenCalledTimes(1)
      expect(updateSection).toHaveBeenCalledWith('appearance', '#222222')
    })

    it('does not write when the value is invalid once the debounce fires', async () => {
      const isValid = vi.fn().mockReturnValue(false)

      mod.queueSettingsWrite('customCacheSize', 'reader', 123, isValid)
      await vi.advanceTimersByTimeAsync(500)

      expect(isValid).toHaveBeenCalled()
      expect(updateSection).not.toHaveBeenCalled()
    })

    it('skips the write when confirmBeforeWrite resolves false', async () => {
      const confirmBeforeWrite = vi.fn().mockResolvedValue(false)

      mod.queueSettingsWrite('customCacheSize', 'reader', 123, () => true, confirmBeforeWrite)
      await vi.advanceTimersByTimeAsync(500)

      expect(confirmBeforeWrite).toHaveBeenCalled()
      expect(updateSection).not.toHaveBeenCalled()
    })

    it('writes when confirmBeforeWrite resolves true', async () => {
      updateSection.mockResolvedValue({ success: true })
      const confirmBeforeWrite = vi.fn().mockResolvedValue(true)

      mod.queueSettingsWrite('customCacheSize', 'reader', 123, () => true, confirmBeforeWrite)
      await vi.advanceTimersByTimeAsync(500)

      expect(updateSection).toHaveBeenCalledWith('reader', 123)
    })

    it('notifies subscribers as soon as the write is queued, not only once committed', () => {
      const listener = vi.fn()
      mod.subscribeToSettingsChange(listener)

      mod.queueSettingsWrite('accentColor', 'appearance', '#111111', () => true)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(updateSection).not.toHaveBeenCalled()
    })
  })

  describe('flushPendingSettingsWrites', () => {
    it('commits pending debounced writes immediately, without waiting for the debounce timer', async () => {
      updateSection.mockResolvedValue({ success: true })

      mod.queueSettingsWrite('accentColor', 'appearance', '#111111', () => true)
      await mod.flushPendingSettingsWrites()

      expect(updateSection).toHaveBeenCalledWith('appearance', '#111111')
    })

    it('skips flushed writes that are invalid at flush time', async () => {
      const isValid = vi.fn().mockReturnValue(false)

      mod.queueSettingsWrite('accentColor', 'appearance', '#111111', isValid)
      await mod.flushPendingSettingsWrites()

      expect(updateSection).not.toHaveBeenCalled()
    })

    it('clears the debounce timer so a flushed write does not also fire later', async () => {
      updateSection.mockResolvedValue({ success: true })

      mod.queueSettingsWrite('accentColor', 'appearance', '#111111', () => true)
      await mod.flushPendingSettingsWrites()
      await vi.advanceTimersByTimeAsync(500)

      expect(updateSection).toHaveBeenCalledTimes(1)
    })
  })
})
