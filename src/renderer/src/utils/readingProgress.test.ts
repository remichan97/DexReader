import { getResumePage } from './readingProgress'

describe('getResumePage', () => {
  it('resumes at the saved page for a chapter in progress', () => {
    expect(getResumePage({ currentPage: 12, completed: false })).toBe(12)
  })

  it('starts from the beginning when there is no saved progress', () => {
    expect(getResumePage(undefined)).toBeUndefined()
  })

  it('starts from the beginning when the saved page is the first page', () => {
    expect(getResumePage({ currentPage: 0, completed: false })).toBeUndefined()
  })

  it('starts a finished chapter from the beginning rather than on its last page', () => {
    expect(getResumePage({ currentPage: 49, completed: true })).toBeUndefined()
  })
})
