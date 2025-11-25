import type { JSX } from 'react'

export function NotFoundView(): JSX.Element {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  )
}
