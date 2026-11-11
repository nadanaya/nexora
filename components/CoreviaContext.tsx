'use client'

import Link from 'next/link'
import { buttonVariants } from '@heroui/react'

const workflow = [
  { team: '영업 · 거래처', detail: '거래처 관계와 장려금 정산 근거 확인', href: '/workspace/relationships' },
  { team: '영업지원 · 영업임원', detail: '관련자 월 합산과 지급 승인 판단', href: '/workspace/approvals' },
  { team: '재무', detail: '승인된 요청의 일정 반영과 모의 지급', href: '/workspace/payments' },
  { team: '내부 감시', detail: '관계 정정의 영향 조사와 감사 추적', href: '/workspace/audit' },
]

export function CoreviaContext() {
  return <section className="corevia-context rounded-card border border-default bg-content" aria-labelledby="corevia-title">
    <div className="corevia-intro">
      <p className="t-caption text-primary">AURORA GROUP · COREVIA COSMETICS</p>
      <p className="t-small">Cosmetics Trade &amp; Rebate Operations</p>
      <h2 id="corevia-title" className="t-section-title">화장품 제조사의 거래처 관계와 판매장려금 의사결정을<br className="hidden xl:block" /> AI와 사람이 함께 처리합니다.</h2>
      <p className="t-body">Corevia Cosmetics는 가상 화장품 그룹 Aurora의 제조 자회사입니다. 화장품 제조·유통으로 이어지는 기업 거래에서 거래처별 판매장려금 요청을 확인하고, 관련 거래처의 월 합산 검증부터 사람 승인과 재무 지급 업무까지 연결합니다.</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/workspace/demo" className={buttonVariants({ variant: 'primary' })}>판매장려금 업무 시연</Link>
        <Link href="/tour" className={buttonVariants({ variant: 'outline' })}>업무 흐름 둘러보기</Link>
      </div>
      <p className="t-caption">W07 제공 자료 · 거래처 마스터, 판매장려금, 입금 이력 · 업무 기준일 2026.07.01</p>
    </div>
    <ol className="corevia-workflow" aria-label="Corevia 판매장려금 협업 흐름">
      {workflow.map(item => <li key={item.team}><Link href={item.href} className="corevia-stage"><span className="t-card-title">{item.team}</span><span className="t-small">{item.detail}</span></Link></li>)}
    </ol>
  </section>
}
