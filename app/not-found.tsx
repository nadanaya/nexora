import Link from 'next/link'

/**
 * 없는 주소로 들어왔을 때 보이는 화면. 코드에서 notFound() 를 불러도 여기로 와요.
 *   import { notFound } from 'next/navigation'
 *   if (!row) notFound()
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="t-caption">404</p>
      <h1 className="t-section-title">페이지를 찾을 수 없어요</h1>
      <p className="t-small text-secondary">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <Link className="text-primary underline" href="/">NEXORA 홈으로</Link>
    </main>
  )
}
