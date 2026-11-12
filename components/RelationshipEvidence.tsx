'use client'

import { useId } from 'react'
import { Button, Chip } from '@heroui/react'

type Edge = { left: string; right: string; matched_fields: string[] }
const labels: Record<string, string> = { representative_name: '대표자', address: '주소', bank_account_no: '등록 정산계좌' }

export function RelationshipEvidence({ groups, edges, agencies, onSelect }: {
  groups: string[][]; edges: Edge[]; agencies: { id: string; name: string }[]; onSelect?: (id: string) => void
}) {
  const titleId = useId()
  const related = groups.filter(group => group.length > 1)
  const names = new Map(agencies.map(a => [a.id, a.name]))
  if (!related.length) return <p className="t-small">현재 기준으로 두 항목 이상 일치하는 관련 거래처 그룹은 없습니다.</p>
  return <div className="flex flex-col gap-6">{related.map((group, groupIndex) => {
    const direct = edges.filter(e => group.includes(e.left) && group.includes(e.right))
    const points = new Map(group.map((id, index) => {
      const point = group.length === 3
        ? [{ x: 130, y: 110 }, { x: 470, y: 50 }, { x: 470, y: 170 }][index]
        : { x: 310 + 210 * Math.cos(index * 2 * Math.PI / group.length), y: 100 + 65 * Math.sin(index * 2 * Math.PI / group.length) }
      return [id, point] as const
    }))
    return <div key={group.join('-')} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2"><p className="t-card-title">관련자 그룹 {groupIndex + 1}</p><Chip size="sm" color="accent"><Chip.Label>{group.length}개 거래처 · 직접 연결 {direct.length}개</Chip.Label></Chip></div>
      <svg viewBox="0 0 640 260" role="group" aria-labelledby={`${titleId}-${groupIndex}`} className="hidden w-full sm:block">
        <title id={`${titleId}-${groupIndex}`}>{group.join(', ')}의 직접 관계. 선이 있는 거래처 사이에서만 두 항목 이상 일치합니다.</title>
        {direct.map(e => <line key={e.left + e.right} x1={points.get(e.left)!.x} y1={points.get(e.left)!.y} x2={points.get(e.right)!.x} y2={points.get(e.right)!.y} stroke="currentColor" strokeWidth="2" className="text-secondary" />)}
        {group.map((id, index) => {
          const point = points.get(id)!
          return <g key={id} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={`${id} 관계 상세 보기`} onClick={() => onSelect?.(id)} onKeyDown={event => { if (onSelect && ['Enter',' '].includes(event.key)) { event.preventDefault(); onSelect(id) } }} className="nx-graph-node"><rect x={point.x - 60} y={point.y - 27} width="120" height="102" fill="transparent" pointerEvents="all" /><circle cx={point.x} cy={point.y} r="22" className="fill-current text-primary" /><text x={point.x} y={point.y + 6} textAnchor="middle" fill="currentColor" className="text-on-primary">{index + 1}</text><text x={point.x} y={point.y + 43} textAnchor="middle" fill="currentColor" className="t-small text-default">{names.get(id) || id}</text><text x={point.x} y={point.y + 65} textAnchor="middle" fill="currentColor" className="t-caption text-secondary">{id}</text></g>
        })}
      </svg>
      <div className="flex flex-wrap gap-2">{group.map(id => onSelect ? <Button key={id} size="sm" variant="outline" onPress={() => onSelect(id)}>{id} 관계 상세 보기</Button> : <Chip key={id} size="sm" color="accent"><Chip.Label>{names.get(id) || id} · {id}</Chip.Label></Chip>)}</div>
      <div className="grid gap-3 md:grid-cols-2">{direct.map(e => <div key={e.left + e.right} className="rounded-card bg-muted p-4"><p className="t-small">{e.left} ↔ {e.right}</p><p className="t-caption">직접 일치 · {e.matched_fields.map(f => labels[f]).join(' + ')}</p></div>)}</div>
      <p className="t-caption">선은 직접 일치한 관계만 나타냅니다. 같은 그룹의 거래처라도 서로 직접 일치하지 않을 수 있습니다.</p>
    </div>
  })}</div>
}
