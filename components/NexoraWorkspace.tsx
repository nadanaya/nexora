'use client'

import { Card, buttonVariants } from '@heroui/react'
import { PageHeader } from '@/components/ax'
import { Shell } from '@/components/Shell'
import { W07Dashboard } from '@/components/W07Dashboard'

export function NexoraWorkspace({
  authenticated,
  userId,
  userName,
  isAdmin,
  signInUrl,
}: {
  authenticated: boolean
  userId: string
  userName: string
  isAdmin: boolean
  signInUrl: string
}) {
  const account = authenticated ? <span className="t-small">{userName || '로그인 사용자'}</span> : (
    <a className={buttonVariants({ variant: 'primary', size: 'sm' })} href={signInUrl}>로그인</a>
  )
  return <Shell appName="NEXORA" account={account} isAdmin={isAdmin}>
    <div className="flex flex-col gap-8">
      <PageHeader
        title="NEXORA"
        description="거래처 관계 분석부터 금융 통제, 사람 승인과 감사까지 연결합니다."
        actions={<span className="t-caption">W07 · 판매장려금 통제</span>}
      />
      <Card><Card.Content>
        <p className="t-small">
          관계 정보의 일치는 검토 신호이며 부정행위 판정이 아닙니다. 회수 계좌는 관계 분석에만 사용하며 지급 계좌로 추정하지 않습니다. 지급은 모의 처리만 기록합니다.
        </p>
      </Card.Content></Card>
      {authenticated ? <W07Dashboard userId={userId} /> : <Card>
        <Card.Header>
          <Card.Title>로그인이 필요합니다</Card.Title>
          <Card.Description>기업 자료와 승인 이력을 보호하기 위해 로그인한 사용자만 이용할 수 있습니다.</Card.Description>
        </Card.Header>
        <Card.Footer><a className={buttonVariants({ variant: 'primary' })} href={signInUrl}>AXHub 로그인</a></Card.Footer>
      </Card>}
    </div>
  </Shell>
}
