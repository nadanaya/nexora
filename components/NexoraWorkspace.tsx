'use client'

import { Card, buttonVariants } from '@heroui/react'
import { PageHeader } from '@/components/ax'
import { Shell } from '@/components/Shell'
import { OperationsDashboard } from '@/components/OperationsDashboard'
import { CoreviaContext } from '@/components/CoreviaContext'

export function NexoraWorkspace({
  authenticated,
  userName,
  isAdmin,
  signInUrl,
  initialTab,
}: {
  authenticated: boolean
  userId: string
  userName: string
  isAdmin: boolean
  signInUrl: string
  initialTab?: string
}) {
  const account = authenticated ? <span className="t-small">{userName || '로그인 사용자'}</span> : (
    <a className={buttonVariants({ variant: 'primary', size: 'sm' })} href={signInUrl}>로그인</a>
  )
  return <Shell appName="NEXORA" account={account} isAdmin={isAdmin}>
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Corevia 판매장려금 운영"
        description="NEXORA · Cosmetics Trade & Rebate Operations"
        actions={<span className="t-caption whitespace-nowrap">W07 · NEXORA</span>}
      />
      {(!initialTab || initialTab === '현황') && <CoreviaContext />}
      <Card><Card.Content>
        <p className="t-small">
          실제 은행 이체 없는 모의 지급 환경입니다. 관계 일치는 검토 신호이며, 입금계좌를 지급 수취계좌로 추정하지 않습니다.
        </p>
      </Card.Content></Card>
      {authenticated ? <OperationsDashboard key={initialTab || 'home'} initialTab={initialTab} /> : <Card>
        <Card.Header>
          <Card.Title>로그인이 필요합니다</Card.Title>
          <Card.Description>기업 자료와 승인 이력을 보호하기 위해 로그인한 사용자만 이용할 수 있습니다.</Card.Description>
        </Card.Header>
        <Card.Footer><a className={buttonVariants({ variant: 'primary' })} href={signInUrl}>AXHub 로그인</a></Card.Footer>
      </Card>}
    </div>
  </Shell>
}
