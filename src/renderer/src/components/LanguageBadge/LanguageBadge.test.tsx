import { render, screen } from '@testing-library/react'
import { LanguageBadge, LanguageFlag } from './LanguageBadge'

describe('LanguageBadge', () => {
  it('shows a flag and the uppercase code, named by the full language for assistive tech', () => {
    const { container } = render(<LanguageBadge code="es-la" />)

    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('ES-LA')).toBeInTheDocument()
    expect(screen.getByLabelText('Spanish (LATAM)')).toHaveAttribute('title', 'Spanish (LATAM)')
  })

  it('shows the full language name instead of the code in name mode', () => {
    render(<LanguageBadge code="pt-br" label="name" />)

    expect(screen.getByText('Portuguese (Brazil)')).toBeInTheDocument()
    expect(screen.queryByText('PT-BR')).toBeNull()
  })

  it('tells romanised variants apart from the base language by their label', () => {
    render(
      <>
        <LanguageBadge code="ja" />
        <LanguageBadge code="ja-ro" />
      </>
    )

    expect(screen.getByText('JA')).toBeInTheDocument()
    expect(screen.getByText('JA-RO')).toBeInTheDocument()
  })

  it('falls back to a neutral icon for a language with no flag', () => {
    const { container } = render(<LanguageBadge code="ca" />)

    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('CA')).toBeInTheDocument()
  })

  it('hides the decorative flag from assistive tech', () => {
    const { container } = render(<LanguageFlag code="ja" />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
