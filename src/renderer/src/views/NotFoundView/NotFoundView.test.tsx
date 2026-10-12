import { StrictMode } from 'react'
import { render, waitFor } from '@testing-library/react'
import { NotFoundView } from './NotFoundView'

const showConfirmDialog = vi.fn()
const navigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate
}))

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { error: vi.fn() }
}))

// A fresh `t` on every render mirrors react-i18next handing out a new function when
// translations load - the thing that used to re-run the effect and reopen the dialog.
vi.mock('@renderer/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

describe('NotFoundView', () => {
  beforeEach(() => {
    showConfirmDialog.mockReset().mockResolvedValue({ success: true })
    navigate.mockReset()
    vi.stubGlobal('api', { showConfirmDialog })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the dialog once and then navigates to Browse', async () => {
    render(<NotFoundView />)

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/browse'))
    expect(showConfirmDialog).toHaveBeenCalledTimes(1)
  })

  it('does not show a second dialog when the view re-renders or effects re-run', async () => {
    const { rerender } = render(
      <StrictMode>
        <NotFoundView />
      </StrictMode>
    )
    rerender(
      <StrictMode>
        <NotFoundView />
      </StrictMode>
    )

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/browse'))
    expect(showConfirmDialog).toHaveBeenCalledTimes(1)
  })
})
