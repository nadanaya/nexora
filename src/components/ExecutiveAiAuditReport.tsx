import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Scale, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  FileText, 
  Building2, 
  Coins, 
  Layers, 
  Activity, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { RebateReview, AIAnalysisResult, ComplianceCheckItem } from '../types';

interface ExecutiveAiAuditReportProps {
  review: RebateReview;
  aiAnalysis: AIAnalysisResult;
  isAnalyzing: boolean;
  onRunAiAnalysis: () => void;
  onConsultAiAdvisor?: () => void;
}

export const ExecutiveAiAuditReport: React.FC<ExecutiveAiAuditReportProps> = ({
  review,
  aiAnalysis,
  isAnalyzing,
  onRunAiAnalysis,
  onConsultAiAdvisor,
}) => {
  const [copied, setCopied] = useState(false);

  const {
    riskLevel,
    riskScore,
    summary,
    relatedPartyNote,
    complianceChecks,
    recommendedAction,
    justificationAdvice,
    auditTrailRecommendation,
    analyzedAt,
    modelUsed,
  } = aiAnalysis;

  // Visual Theme Config based on Risk Level
  const getRiskTheme = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          textColor: 'text-rose-400',
          bgColor: 'bg-rose-950/40',
          borderColor: 'border-rose-500/50',
          glowShadow: 'shadow-rose-950/40',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          gaugeColor: '#f43f5e',
          accentGradient: 'from-rose-950/60 via-[#100810] to-[#070b12]',
          label: 'CRITICAL RISK',
          subLabel: '심각한 내부통제 위반 또는 이해상충 감지',
        };
      case 'HIGH':
        return {
          textColor: 'text-orange-400',
          bgColor: 'bg-orange-950/40',
          borderColor: 'border-orange-500/50',
          glowShadow: 'shadow-orange-950/40',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          gaugeColor: '#fb923c',
          accentGradient: 'from-orange-950/50 via-[#0f0c10] to-[#070b12]',
          label: 'HIGH RISK',
          subLabel: '한도 초과 또는 주요 증빙 보완 필수',
        };
      case 'MEDIUM':
        return {
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-950/40',
          borderColor: 'border-amber-500/50',
          glowShadow: 'shadow-amber-950/30',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gaugeColor: '#fbbf24',
          accentGradient: 'from-amber-950/40 via-[#0c0f17] to-[#070b12]',
          label: 'MEDIUM RISK',
          subLabel: '특수관계자 심의 및 조건부 승인 대상',
        };
      default:
        return {
          textColor: 'text-emerald-400',
          bgColor: 'bg-emerald-950/40',
          borderColor: 'border-emerald-500/50',
          glowShadow: 'shadow-emerald-950/30',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          gaugeColor: '#10b981',
          accentGradient: 'from-emerald-950/40 via-[#070e17] to-[#070b12]',
          label: 'LOW RISK',
          subLabel: 'W07 계약 산식 및 한도 정상 부합',
        };
    }
  };

  const theme = getRiskTheme(riskLevel);

  // Executive Stamp for Recommended Action
  const getActionSeal = (action: string) => {
    switch (action) {
      case 'APPROVE':
        return {
          title: '전결권자 승인 가결 (APPROVE)',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          border: 'border-emerald-500/60',
          icon: CheckCircle2,
          color: 'text-emerald-400',
          decree: '계약 요율 및 펌뱅킹 유효성 검증 완료. 재무팀 즉시 집행 승인 권고.',
        };
      case 'APPROVE_WITH_CONDITION':
        return {
          title: '조건부 승인 (APPROVE WITH CONDITION)',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          border: 'border-amber-500/60',
          icon: AlertTriangle,
          color: 'text-amber-400',
          decree: '영업 소명서 접수 및 지주사 감사위원회 공시대장 사전 등재 후 집행.',
        };
      case 'REQUEST_EXPLANATION':
        return {
          title: '영업 소명 및 서류 보완 (REQUEST EXPLANATION)',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
          border: 'border-cyan-500/60',
          icon: FileText,
          color: 'text-cyan-400',
          decree: '수취계좌 실명 불일치 해소 또는 Q3 실판매 POS 증빙 제출 시까지 보류.',
        };
      case 'REJECT':
      default:
        return {
          title: '지급 불승인 / 즉시 반려 (REJECT)',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          border: 'border-rose-500/60',
          icon: XCircle,
          color: 'text-rose-400',
          decree: 'W07 내부통제 중대 위반. 부당 장려금 횡령 리스크 차단을 위해 결재 기각.',
        };
    }
  };

  const actionSeal = getActionSeal(recommendedAction);
  const ActionIcon = actionSeal.icon;

  // SVG Gauge calculations (radius = 54, circumference = 2 * PI * 54 = 339.29)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  const handleCopyReport = () => {
    const reportText = `[NEXORA Corevia Cosmetics 심층 감사 보고서]
- 심사 대상: ${review.vendorName} (${review.code})
- 신청 장려금: ₩${review.calculatedRebateAmount.toLocaleString()}원
- AI 위험 등급: ${riskLevel} (${riskScore}/100점)
- 권고 조치: ${recommendedAction}
- 종합 의견: ${summary}
- 특수관계자 주석: ${relatedPartyNote}
- 실무 지침: ${justificationAdvice}
- 감사 대장: ${auditTrailRecommendation}
- 모델: ${modelUsed} (${analyzedAt})`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Verification Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#060a12] border border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-xs font-bold text-stone-100 tracking-wider">
                EXECUTIVE DEEP AUDIT DECREE
              </span>
              <span className="font-mono text-[10px] px-2 py-0.2 rounded bg-stone-900 text-stone-400 border border-stone-800">
                {modelUsed}
              </span>
            </div>
            <div className="text-[11px] text-stone-400 font-sans">
              심사일시: {analyzedAt} · 관할: Corevia Cosmetics B2B 감사위원회
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onConsultAiAdvisor && (
            <button
              onClick={onConsultAiAdvisor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer shadow-sm transition"
              title="이 심층 보고서에 대해 AI 자문관과 대화합니다."
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>AI 자문관 질의</span>
            </button>
          )}

          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-medium cursor-pointer transition"
            title="감사 보고서 전체 복사"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-stone-400" />
            )}
            <span>{copied ? '복사됨' : '보고서 복사'}</span>
          </button>

          <button
            onClick={onRunAiAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-950/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-950" />
            <span>{isAnalyzing ? '재분석 중...' : 'AI 재분석'}</span>
          </button>
        </div>
      </div>

      {/* Main Executive Showcase Card: Radial Risk Gauge + Action Seal */}
      <div className={`p-6 rounded-2xl bg-gradient-to-br ${theme.accentGradient} border ${theme.borderColor} shadow-2xl ${theme.glowShadow} transition-all relative overflow-hidden`}>
        {/* Subtle Background Watermark */}
        <div className="absolute right-0 top-0 bottom-0 pointer-events-none opacity-5 flex items-center pr-10">
          <Scale className="w-64 h-64 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          {/* Col 1: Circular Risk Gauge (4 cols) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-[#060a12]/80 border border-stone-800/80 backdrop-blur-md">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                {/* Background Track */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-stone-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Colored Progress Arc */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke={theme.gaugeColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Gauge Center Content */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-cinzel text-stone-400 font-bold tracking-widest uppercase">
                  RISK SCORE
                </span>
                <span className={`text-3xl font-editorial font-bold ${theme.textColor} leading-tight`}>
                  {riskScore}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">/ 100</span>
              </div>
            </div>

            {/* Risk Level Badge */}
            <div className="mt-3 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider border ${theme.badgeBg}`}>
                ● {theme.label}
              </span>
              <p className="text-[11px] text-stone-400 mt-1 font-sans">
                {theme.subLabel}
              </p>
            </div>
          </div>

          {/* Col 2: Recommended Action Decree Stamp (8 cols) */}
          <div className="md:col-span-8 flex flex-col justify-between space-y-4">
            {/* Action Decree Stamp Box */}
            <div className={`p-4 rounded-xl bg-[#060a12]/90 border-2 ${actionSeal.border} shadow-lg relative`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0 ${actionSeal.color}`}>
                  <ActionIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-cinzel font-bold text-stone-400 tracking-wider">
                      RECOMMENDED ACTION DECREE
                    </span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase font-mono border ${actionSeal.badge}`}>
                      {recommendedAction}
                    </span>
                  </div>
                  <h3 className={`text-base font-editorial font-bold mt-0.5 ${actionSeal.color}`}>
                    {actionSeal.title}
                  </h3>
                  <p className="text-xs text-stone-200 mt-1 leading-relaxed font-sans font-medium">
                    {actionSeal.decree}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Summary Memo */}
            <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 text-xs text-stone-300 leading-relaxed font-sans">
              <span className="font-editorial text-amber-300 font-bold mr-1.5">[종합 심사 의견]</span>
              {summary}
            </div>
          </div>
        </div>
      </div>

      {/* 4 W07 Core Compliance Checks Grid with High-Fidelity Status */}
      <div className="p-4 rounded-2xl bg-[#060a12] border border-stone-800 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="font-editorial text-sm font-bold text-stone-100">
              삼일PwC W07 핵심 4대 통제 규정 정밀 진단 (Compliance Matrix)
            </h4>
          </div>
          <span className="text-[10px] font-cinzel text-stone-500">
            4 OF 4 CHECKS EVALUATED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {complianceChecks.map((chk, i) => {
            const isDanger = chk.severity === 'DANGER';
            const isWarn = chk.severity === 'WARN';
            const isOk = chk.severity === 'OK';

            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDanger
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-stone-900/40 border-stone-800 text-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isOk ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className={`w-4 h-4 shrink-0 ${isDanger ? 'text-rose-400' : 'text-amber-400'}`} />
                    )}
                    <span className="font-bold text-xs text-stone-100">
                      {chk.label}
                    </span>
                  </div>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase border ${
                    isDanger ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    isWarn ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {chk.pass ? 'PASS' : chk.severity}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-2 pl-6 leading-relaxed">
                  {chk.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Special Disclosures & Directives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: Related Party & Group Governance Note */}
        <div className="p-4 rounded-2xl bg-[#070b13] border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-cinzel font-bold">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>지배구조 및 특수관계인 공시 주석</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            {relatedPartyNote}
          </p>
          <div className="text-[10px] text-amber-400/80 pt-1 font-mono">
            * Aurora Holdings 감사위원회 분기 내부거래 공시대장 열람 대상
          </div>
        </div>

        {/* Card 2: Operations & Finance Execution Directive */}
        <div className="p-4 rounded-2xl bg-[#0a0c18] border border-indigo-500/30 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-cinzel font-bold">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>영업·재무 실무 조치 지침 (Justification Advice)</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            {justificationAdvice}
          </p>
          <div className="text-[10px] text-indigo-400/80 pt-1 font-mono">
            * 감사 대장 권고: {auditTrailRecommendation}
          </div>
        </div>
      </div>
    </div>
  );
};
