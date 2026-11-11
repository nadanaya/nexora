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
  return <section className="corevia-context" aria-labelledby="corevia-title">
    <div className="corevia-hero">
      <div className="corevia-hero-copy">
        <p className="corevia-eyebrow">AURORA GROUP / COREVIA COSMETICS</p>
        <p className="corevia-wordmark">NEXORA</p>
        <p className="corevia-subtitle">Cosmetics Trade &amp;<br />Rebate Operations</p>
        <div className="corevia-hero-bottom"><span>연결된 거래, 근거 있는 결정.</span><span>W07 OPERATIONS / 2026</span></div>
      </div>
      <div className="corevia-still-life" aria-hidden="true">
        <div className="corevia-orbit" />
        <div className="corevia-plinth" />
        <div className="corevia-bottle corevia-bottle-tall"><i /><span>COREVIA<br /><small>COSMETICS</small></span></div>
        <div className="corevia-bottle corevia-bottle-short"><i /><span>AURORA<br /><small>TRADE / CARE</small></span></div>
        <div className="corevia-jar"><i /><span>C / C</span></div>
        <span className="corevia-art-caption">BRAND ILLUSTRATION · 실제 제품·생산 데이터 아님</span>
      </div>
    </div>
    <div className="corevia-intro">
      <div className="corevia-intro-heading">
      <p className="t-caption text-primary">AURORA GROUP · COREVIA COSMETICS</p>
      <h2 id="corevia-title">화장품의 가치를 잇는 거래,<br />신뢰로 이어지는 의사결정.</h2>
      <div className="flex flex-wrap gap-2">
        <Link href="/workspace/demo" className={buttonVariants({ variant: 'primary' })}>판매장려금 업무 시연 ↗</Link>
        <Link href="/tour" className={buttonVariants({ variant: 'outline' })}>업무 흐름 둘러보기</Link>
      </div>
      </div>
      <div className="corevia-intro-body">
      <p className="corevia-purpose">화장품 제조사의 거래처 관계와 판매장려금 의사결정을 AI와 사람이 함께 처리하는 운영 시스템입니다.</p>
      <p className="t-body">Corevia Cosmetics는 가상 화장품 그룹 Aurora의 제조 자회사입니다. 화장품 제조·유통으로 이어지는 기업 거래에서 거래처별 판매장려금 요청을 확인하고, 관련 거래처의 월 합산 검증부터 사람 승인과 재무 지급 업무까지 연결합니다.</p>
      <p className="t-caption">W07 제공 자료 · 거래처 마스터, 판매장려금, 입금 이력 · 업무 기준일 2026.07.01</p>
      <details className="t-small">
        <summary className="cursor-pointer text-primary">NEXORA에 담은 의미</summary>
        <div className="mt-3 flex flex-col gap-2">
          <p>데이터와 AI를 통해 기업의 다음 의사결정을 연결하는 플랫폼이라는 의미를 담은 창작 브랜드명입니다.</p>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div><dt className="t-card-title">NEX · Next</dt><dd>다음 단계의 의사결정</dd></div>
            <div><dt className="t-card-title">OR · Oracle</dt><dd>데이터 기반 분석과 통찰</dd></div>
            <div><dt className="t-card-title">A · Aura</dt><dd>기업 전체를 연결하는 플랫폼</dd></div>
          </dl>
        </div>
      </details>
      </div>
    </div>
    <div className="corevia-workflow-heading"><p className="corevia-eyebrow">CONNECTED OPERATIONS</p><h3>하나의 요청에서,<br />함께 움직이는 네 부서.</h3><p>관계 확인부터 지급과 감사까지.<br />판단의 근거와 책임을 연결합니다.</p></div>
    <ol className="corevia-workflow" aria-label="Corevia 판매장려금 협업 흐름">
      {workflow.map((item, index) => <li key={item.team}><Link href={item.href} className="corevia-stage"><span className="corevia-stage-number">0{index + 1}</span><span className="corevia-stage-name">{item.team}<span aria-hidden="true">↗</span></span><span className="corevia-stage-detail">{item.detail}</span></Link></li>)}
    </ol>
  </section>
}
