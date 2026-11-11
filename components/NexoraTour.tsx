'use client'

/* eslint-disable @next/next/no-html-link-for-pages -- Document navigation preserves the scroll position when returning from a tour section. */
import { useEffect, useRef } from 'react'
import { buttonVariants } from '@heroui/react'
import { Shell } from '@/components/Shell'

const chapters = [
  {
    id: 'inspect', title: '거래처 관계와 지급 한도 확인',
    description: '직접 일치와 전이 연결을 살펴보고, 관련 거래처의 월 합산 금액을 확인합니다.',
    layers: ['거래처 관계', '월별 합산', '승인 한도'],
    links: [['관계 분석', '/workspace/relationships'], ['합산 검증', '/workspace/incentives']],
  },
  {
    id: 'decide', title: '판단 근거를 검토하고 승인',
    description: '증빙과 판단 근거를 확인한 뒤, 역할이 있는 담당자가 승인하거나 거절합니다.',
    layers: ['증빙 확인', '판단 근거', '담당자 승인'],
    links: [['AI 판단 센터', '/workspace/ai'], ['승인 업무함', '/workspace/approvals']],
  },
  {
    id: 'execute', title: '모의 지급과 후속 작업',
    description: '승인된 요청의 재무 일정을 반영하고, 증빙 보완이나 관계 조사 작업을 처리합니다.',
    layers: ['승인 결과', '재무 일정', '부서별 작업'],
    links: [['모의 지급 센터', '/workspace/payments'], ['후속 작업', '/workspace/tasks']],
  },
  {
    id: 'replay', title: '변경 전후 판단과 감사 기록',
    description: '계좌 정정으로 합산 금액과 승인 권한이 달라지는 과정을 비교합니다. Guided Demo에서 정상 지급, 관계 변경, 보류·거절을 실행할 수 있습니다.',
    layers: ['변경 전', '관계 정정', '변경 후'],
    links: [['Guided Demo 실행', '/workspace/demo'], ['Decision Replay', '/workspace/replay'], ['감사 추적', '/workspace/audit']],
  },
]

export function NexoraTour({ authenticated, isAdmin, signInUrl }: {
  authenticated: boolean
  isAdmin: boolean
  signInUrl?: string
}) {
  const tour = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scenes = tour.current?.querySelectorAll<HTMLElement>('[data-tour-scene]')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    function render() {
      frame = 0
      for (const scene of scenes ?? []) {
        const bounds = scene.getBoundingClientRect()
        const position = (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)
        const progress = Math.max(0, Math.min(1, position))
        scene.style.setProperty('--tour-progress', String(progress))
      }
    }

    function schedule() {
      if (!frame && !reducedMotion.matches) frame = window.requestAnimationFrame(render)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    reducedMotion.addEventListener('change', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      reducedMotion.removeEventListener('change', schedule)
    }
  }, [])

  return <Shell appName="NEXORA" isAdmin={isAdmin} account={null}>
    <div ref={tour} className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-card bg-content p-6 sm:p-10">
        <p className="t-caption">NEXORA · 판매장려금 통제</p>
        <h1 className="t-page-title">관계가 바뀌면 승인도 달라집니다</h1>
        <p className="t-body">거래처 확인부터 승인, 모의 지급, 감사 기록까지 실제 업무 화면으로 이어집니다.</p>
        {!authenticated && <p className="t-small">업무 화면과 합성 시연은 AXHub 로그인 후 이용할 수 있습니다.</p>}
        <div className="flex flex-wrap gap-3">
          <a className={buttonVariants({ variant: 'primary' })} href="/workspace/demo">Guided Demo 열기</a>
          {!authenticated && signInUrl && <a className={buttonVariants({ variant: 'outline' })} href={signInUrl}>AXHub 로그인</a>}
        </div>
      </header>
      <nav aria-label="업무 흐름 바로가기" className="flex flex-wrap gap-2">
        {chapters.map(chapter => <a key={chapter.id} href={`#${chapter.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{chapter.title}</a>)}
      </nav>
      {chapters.map(chapter => <section key={chapter.id} id={chapter.id} data-tour-scene className="nx-tour-section grid items-center gap-6 rounded-card bg-content p-6 md:grid-cols-2 sm:p-10" aria-labelledby={`${chapter.id}-title`}>
        <div className="flex min-w-0 flex-col gap-4">
          <h2 id={`${chapter.id}-title`} className="t-section-title">{chapter.title}</h2>
          <p className="t-body">{chapter.description}</p>
          <div className="flex flex-wrap gap-2">
            {chapter.links.map(([label, path]) => <a key={path} href={path} className={buttonVariants({ variant: 'outline' })}>{label}</a>)}
          </div>
        </div>
        <div className="nx-tour-scene rounded-card bg-surface" aria-hidden="true">
          <div className="nx-tour-stack">
            {chapter.layers.map(label => <div key={label} className="nx-tour-layer rounded-card border border-default bg-content text-default t-card-title">{label}</div>)}
          </div>
        </div>
      </section>)}
      <div className="flex flex-wrap gap-2">
        <a className={buttonVariants({ variant: 'outline' })} href="/">통제 현황</a>
        {isAdmin && <a className={buttonVariants({ variant: 'outline' })} href="/workspace/admin">업무 역할 설정</a>}
      </div>
    </div>
  </Shell>
}
