import { assertNonNullObject } from './assert-non-null-object.util'

it('does not throw for a plain object', () => {
  expect(() => assertNonNullObject({ a: 1 }, 'bad value')).not.toThrow()
})

it.each([null, undefined, 'a string', 42, true])('throws a TypeError for %s', (value) => {
  expect(() => assertNonNullObject(value, 'bad value')).toThrow(TypeError)
})

it('throws with the given message', () => {
  expect(() => assertNonNullObject(null, 'custom message')).toThrow('custom message')
})
