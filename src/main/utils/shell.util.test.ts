import { shell } from 'electron'
import { openExternal } from './shell.util'

vi.mock('electron', () => ({
  shell: { openExternal: vi.fn() }
}))

describe('openExternal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(shell.openExternal).mockResolvedValue(undefined)
  })

  it.each([
    'http://example.com',
    'https://example.com/path?query=1#hash',
    'mailto:support@example.com',
    'HTTPS://EXAMPLE.COM'
  ])('opens an allowed URL (%s) exactly as given', async (url) => {
    await openExternal(url)

    expect(shell.openExternal).toHaveBeenCalledExactlyOnceWith(url)
  })

  it.each([
    ['file:///etc/passwd', 'file:'],
    ['javascript:alert(1)', 'javascript:'],
    ['ftp://example.com/file', 'ftp:'],
    ['app://malicious', 'app:'],
    ['ms-settings:network-proxy', 'ms-settings:']
  ])('rejects %s and names the protocol (%s)', async (url, protocol) => {
    await expect(openExternal(url)).rejects.toThrow(`Protocol ${protocol} is not allowed`)

    expect(shell.openExternal).not.toHaveBeenCalled()
  })

  it.each(['not a url', '', '//example.com', '/relative/path'])(
    'rejects a malformed URL (%j)',
    async (url) => {
      await expect(openExternal(url)).rejects.toThrow(`Invalid URL: ${url}`)

      expect(shell.openExternal).not.toHaveBeenCalled()
    }
  )

  it('passes on a failure from shell.openExternal', async () => {
    vi.mocked(shell.openExternal).mockRejectedValue(new Error('no handler'))

    await expect(openExternal('https://example.com')).rejects.toThrow('no handler')
  })
})
