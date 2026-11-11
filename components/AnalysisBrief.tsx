'use client'

export type AnalysisOutput = { summary: string; decision_context?: string; risk_level?: string; recommendation?: string; alternatives?: string[]; affected_departments?: string[]; assumptions?: string[]; uncertainties: string[]; suggested_actions: string[]; missing_evidence: string[]; relationship_evidence: { claim: string }[]; payment_risks: { claim: string }[] }
export function AnalysisBrief({ output }: { output: AnalysisOutput }) {
  const risk: Record<string,string> = { LOW:'낮음',MEDIUM:'중간',HIGH:'높음',UNKNOWN:'확정하지 않음' }
  return <div className="flex flex-col gap-2"><p className="t-body">{output.summary}</p>{output.decision_context && <p className="t-small">판단 문맥: {output.decision_context}</p>}{output.risk_level && <p className="t-small">설명용 위험 수준: {risk[output.risk_level] || '확인 필요'} · 승인 권한에 영향 없음</p>}{output.recommendation && <p className="t-small">검토 권고: {output.recommendation}</p>}{!!output.affected_departments?.length && <p className="t-small">영향 부서: {output.affected_departments.join(' · ')}</p>}{!!output.alternatives?.length && <p className="t-small">대안: {output.alternatives.join(' / ')}</p>}{!!output.assumptions?.length && <p className="t-small">추가 가정: {output.assumptions.join(' / ')}</p>}</div>
}
