import { act, renderHook } from '@testing-library/react'
import { useDebounce, useDebouncedCallback } from './useDebounce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('first', 500))

    expect(result.current).toBe('first')
  })

  it('does not update the value before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'first' }
    })

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(result.current).toBe('first')
  })

  it('updates to the latest value once the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'first' }
    })

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('second')
  })

  it('resets the timer on each rapid change, applying only the final value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'first' }
    })

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    rerender({ value: 'third' })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('third')
  })

  it('clears the pending timeout on unmount', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'first' }
    })

    rerender({ value: 'second' })
    unmount()

    expect(() => vi.advanceTimersByTime(500)).not.toThrow()
  })
})

describe('useDebouncedCallback', () => {
  it('does not invoke the callback before the delay elapses', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('arg1')
    })
    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('invokes the callback with the latest args once the delay elapses', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('arg1')
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('arg1')
  })

  it('resets the timer on each rapid call, invoking the callback once with only the last args', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('arg1')
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    act(() => {
      result.current('arg2')
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('arg2')
  })

  it('clears the pending timeout on unmount, so the callback never fires', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('arg1')
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).not.toHaveBeenCalled()
  })
})
