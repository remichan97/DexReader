import type { JSX } from 'react'
import { useParams } from 'react-router-dom'

export function ReaderView(): JSX.Element {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>()

  return (
    <div style={{ padding: '24px' }}>
      <h1>Reader</h1>
      <p>Manga ID: {mangaId}</p>
      <p>Chapter ID: {chapterId}</p>
    </div>
  )
}
