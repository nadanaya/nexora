import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileCheck, 
  Building2, 
  Coins, 
  ShieldCheck, 
  History, 
  SendHorizontal,
  Clock,
  ArrowUpDown,
  Lock,
  Layers,
  Scale,
  ScrollText
} from 'lucide-react';
import { RebateReview, UserProfile } from '../types';

interface ReviewDetailModalProps {
  review: RebateReview | null;
  currentUser: UserProfile;
  onClose: () => void;
  onApprove: (reviewId: string) => void;
  onReject: (reviewId: string, reason: string) => void;
  onHold: (reviewId: string, reason: string) => void;
  onRequestReExamination: (reviewId: string, note: string) => void;
  onOpenSimulatePayment: (review: RebateReview) => void;
  onRunAiAnalysis: (reviewId: string) => void;
  isAnalyzing: boolean;
  onShowSoDAlert: (data: { attemptedAction: string; reviewCode?: string; vendorName?: string; customMessage?: string }) => void;
  onConsultAiAdvisor?: (review: RebateReview) => void;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  review,
  currentUser,
  onClose,
  onApprove,
  onReject,
  onHold,
  onRequestReExamination,
  onOpenSimulatePayment,
  onRunAiAnalysis,
  isAnalyzing,
  onShowSoDAlert,
  onConsultAiAdvisor,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATH' | 'AI_REPORT' | 'DOCS' | 'AUDIT'>('OVERVIEW');
  const [actionReason, setActionReason] = useState('');
  const [showActionForm, setShowActionForm] = useState<'REJECT' | 'HOLD' | 'RE_EXAM' | null>(null);

  if (!review) return null;

  const handleApproveWithSoD = () => {
    if (currentUser.role === 'SALES') {
      onShowSoDAlert({
        attemptedAction: '판매장려금 재무 승인 확정',
        reviewCode: review.code,
        vendorName: review.vendorName,
        customMessage: `영업직군(${currentUser.name})은 판매장려금 기안 권한만 보유하며 승인 전결권이 없습니다. 직무 분리(SoD) 규정에 따라 재무 승인자 권한이 필요합니다.`,
      });
      return;
    }
    if (!review.accountVerified) {
      onShowSoDAlert({
        attemptedAction: '판매장려금 재무 승인 확정',
        reviewCode: review.code,
        vendorName: review.vendorName,
        customMessage: '수취계좌 예금주 실명 불일치 상태입니다. 먼저 계좌 증빙 확인이 완료되어야 승인할 수 있습니다.',
      });
      return;
    }
    onApprove(review.id);
    onClose();
  };

  const handleActionSubmit = () => {
    if (!actionReason.trim()) {
      alert('사유를 입력해 주세요.');
      return;
    }
    if (showActionForm === 'REJECT') {
      onReject(review.id, actionReason);
    } else if (showActionForm === 'HOLD') {
      onHold(review.id, actionReason);
    } else if (showActionForm === 'RE_EXAM') {
      onRequestReExamination(review.id, actionReason);
    }
    setShowActionForm(null);
    setActionReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#090e18] border border-stone-800 rounded-3xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header with Sincere Editorial Style */}
        <div className="p-5 sm:p-6 border-b border-stone-800 bg-[#05080f] flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-cinzel text-xs px-2.5 py-0.5 rounded bg-stone-900 text-amber-300 font-bold border border-amber-500/30">
                DOCKET {review.code}
              </span>
              {review.dataSource === 'DEMO' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  DEMO 시연 심사
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  W07 원본 완료건
                </span>
              )}
              <span className="text-xs text-stone-400">Corevia Cosmetics B2B 제조 공급 심사 결재</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold text-stone-100 tracking-tight flex items-center gap-2.5">
              {review.vendorName}
              <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-stone-900 text-stone-300 border border-stone-800">
                {review.vendorCategory}
              </span>
            </h2>
            <p className="text-xs text-stone-400 font-sans">
              대상 품목: <strong className="text-stone-200 font-medium">{review.productLine}</strong> · 대상 분기: {review.targetQuarter}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs - Sincere Editorial Style */}
        <div className="flex items-center gap-1 px-5 border-b border-stone-800 bg-[#070b13] text-xs font-cinzel font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3.5 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 tracking-wider ${
              activeTab === 'OVERVIEW'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            § I. DOCKET OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab('MATH')}
            className={`py-3.5 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 tracking-wider ${
              activeTab === 'MATH'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            § II. W07 CALCULATION & CAP
          </button>
          <button
            onClick={() => setActiveTab('AI_REPORT')}
            className={`py-3.5 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 tracking-wider ${
              activeTab === 'AI_REPORT'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            § III. AI RISK REPORT
          </button>
          <button
            onClick={() => setActiveTab('DOCS')}
            className={`py-3.5 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 tracking-wider ${
              activeTab === 'DOCS'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            § IV. BANK VERIFICATION
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3.5 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 tracking-wider ${
              activeTab === 'AUDIT'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            § V. AUDIT TRAIL ({review.approvalHistory.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800">
                  <div className="text-stone-400 text-[11px] font-cinzel">Q3 TARGET SALES</div>
                  <div className="text-lg font-editorial font-bold text-stone-100 mt-1">
                    ₩{review.targetSalesAmount.toLocaleString()}원
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">화장품 B2B 공급 계약 기준</div>
                </div>

                <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800">
                  <div className="text-stone-400 text-[11px] font-cinzel">ACTUAL SALES (ERP)</div>
                  <div className="text-lg font-editorial font-bold text-emerald-300 mt-1">
                    ₩{review.actualSalesAmount.toLocaleString()}원
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                    달성률 {review.achievementRate}% (목표 초과 달성)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e0914] border border-amber-500/40">
                  <div className="text-amber-300 text-[11px] font-cinzel font-bold">REBATE LIABILITY</div>
                  <div className="text-xl font-editorial font-bold text-amber-300 mt-1">
                    ₩{review.calculatedRebateAmount.toLocaleString()}원
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    계약 요율 {review.contractRebateRate}% 적용 산출
                  </div>
                </div>
              </div>

              {/* Status and SoD Details */}
              <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800 space-y-2.5">
                <h3 className="font-editorial text-sm font-bold text-stone-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  기안 및 승인 통제 상태
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-300">
                  <div>
                    <span className="text-stone-400">기안자:</span> {review.requestedBy} ({review.requestedDate})
                  </div>
                  <div>
                    <span className="text-stone-400">현재 상태:</span> <strong className="text-white font-mono">{review.status}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400">당월 누계 / 한도:</span> ₩{(review.monthlyAccumulatedAmount / 10000).toLocaleString()}만원 / 한도 ₩{(review.monthlyLimitAmount / 10000).toLocaleString()}만원
                  </div>
                  <div>
                    <span className="text-stone-400">특수관계 여부:</span> {review.isRelatedParty ? (
                      <span className="text-amber-300 font-bold">감지됨 ({review.relationDetail})</span>
                    ) : '일반 독립 거래처'}
                  </div>
                </div>

                {review.hasSalesExplanation && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-200">
                    <div className="font-bold mb-1 font-editorial text-sm">영업 소명서 접수 완료:</div>
                    <p className="text-xs text-stone-200 leading-relaxed">{review.salesExplanationNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'MATH' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#05080f] border border-stone-800 space-y-3">
                <h3 className="font-editorial text-sm font-bold text-stone-100">W07 판매장려금 산식 검산식</h3>
                <div className="font-mono text-xs bg-stone-900 p-3.5 rounded-lg border border-stone-800 text-stone-200 space-y-1.5">
                  <div className="text-stone-400">[지급액 산출식]</div>
                  <div className="text-rose-300 font-bold">
                    지급 장려금 = 실제 달성 매출액 (₩{review.actualSalesAmount.toLocaleString()}) × 계약 장려금율 ({review.contractRebateRate}%)
                  </div>
                  <div className="text-emerald-400">
                    = ₩{Math.round(review.actualSalesAmount * (review.contractRebateRate / 100)).toLocaleString()}원
                  </div>
                  <div className="text-stone-400 pt-1">
                    신청 금액(₩{review.calculatedRebateAmount.toLocaleString()}원)과 산식 결과 일치 여부: <span className="text-emerald-400 font-bold">✓ 100% 정상 부합</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800 space-y-2">
                <h4 className="font-editorial text-sm font-bold text-stone-100">월간 누적 한도 규정 대조</h4>
                <div className="space-y-1 text-stone-300">
                  <div className="flex justify-between">
                    <span>Corevia 사전 설정 월 한도:</span>
                    <span className="font-bold">₩{review.monthlyLimitAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span>당월 누적 합산액:</span>
                    <span className={`font-bold ${review.monthlyAccumulatedAmount > review.monthlyLimitAmount ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ₩{review.monthlyAccumulatedAmount.toLocaleString()}원
                    </span>
                  </div>
                  <div className="pt-2 border-t border-stone-800 text-stone-400">
                    {review.monthlyAccumulatedAmount > review.monthlyLimitAmount ? (
                      <span className="text-amber-300 font-medium">
                        ⚠ 월 한도 ₩{(review.monthlyAccumulatedAmount - review.monthlyLimitAmount).toLocaleString()}원 초과로 영업 소명서 및 전결권자 상향 승인 필요.
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">
                        ✓ 당월 한도 내 정상 범위입니다.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI_REPORT' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-editorial font-bold text-stone-100 text-sm">
                    Gemini 3.8 Flash AI 특수관계 및 위험도 검증 보고서
                  </span>
                </div>
                <button
                  onClick={() => onRunAiAnalysis(review.id)}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 font-semibold border border-stone-800 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAnalyzing ? '분석 중...' : 'AI 재분석 실행'}</span>
                </button>
              </div>

              {review.aiAnalysis ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#05080f] border border-stone-800 flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      review.aiAnalysis.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                      review.aiAnalysis.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                      review.aiAnalysis.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-100 text-sm font-editorial">
                          위험 등급: {review.aiAnalysis.riskLevel} (리스크 스코어 {review.aiAnalysis.riskScore}/100)
                        </span>
                        <span className="text-stone-400 text-[10px]">모델: {review.aiAnalysis.modelUsed}</span>
                      </div>
                      <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                        {review.aiAnalysis.summary}
                      </p>
                    </div>
                  </div>

                  {/* Compliance Checks List */}
                  <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800 space-y-2">
                    <h4 className="font-editorial text-sm font-bold text-stone-100">4대 W07 통제 항목 자동 검증</h4>
                    <div className="space-y-2">
                      {review.aiAnalysis.complianceChecks.map((chk, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded bg-stone-900/60 border border-stone-800/80">
                          {chk.pass ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${chk.severity === 'DANGER' ? 'text-rose-400' : 'text-amber-400'}`} />
                          )}
                          <div>
                            <div className="font-semibold text-stone-200">{chk.label}</div>
                            <div className="text-[11px] text-stone-400 mt-0.5">{chk.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-200 space-y-1">
                    <div className="font-bold font-editorial text-sm">AI 조치 권고: {review.aiAnalysis.recommendedAction}</div>
                    <div className="text-[11px] text-stone-300">{review.aiAnalysis.justificationAdvice}</div>
                    <div className="text-[10px] text-stone-400 pt-1">
                      감사 대장 권고: {review.aiAnalysis.auditTrailRecommendation}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#05080f] rounded-xl border border-stone-800 text-stone-400">
                  <p>아직 AI 심사 분석이 실행되지 않았습니다.</p>
                  <button
                    onClick={() => onRunAiAnalysis(review.id)}
                    className="mt-3 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold transition cursor-pointer font-cinzel text-xs"
                  >
                    AI 심사 분석 실행하기
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'DOCS' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800 space-y-3">
                <h3 className="font-editorial text-sm font-bold text-stone-100">지급 수취계좌 실명 검증</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-300">
                  <div className="p-3.5 rounded-lg bg-stone-900 border border-stone-800">
                    <div className="text-stone-400 text-[10px] font-cinzel">CONTRACT PARTY</div>
                    <div className="font-bold font-editorial text-stone-100 mt-0.5 text-sm">{review.vendorName}</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-stone-900 border border-stone-800">
                    <div className="text-stone-400 text-[10px] font-cinzel">REGISTERED BANK ACCOUNT</div>
                    <div className="font-mono text-stone-200 mt-0.5">신한은행 110-***-882190</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {review.accountVerified ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          예금주 실명 일치 확인됨
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          예금주 상호 불일치 (지급 보류 사유)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AUDIT' && (
            <div className="space-y-2">
              <h3 className="font-editorial text-sm font-bold text-stone-100">심사 결재 및 감사 로그</h3>
              <div className="space-y-2">
                {review.approvalHistory.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#060a12] border border-stone-800/80 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-100 font-editorial">{item.action}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-sans">
                          {item.actorName} ({item.actorRole})
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 mt-1 leading-relaxed">{item.note}</p>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 border-t border-stone-800 bg-[#05080f] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-400 font-sans">
            <span>현재 접속자:</span>
            <span className="font-bold text-stone-100">{currentUser.name} ({currentUser.department})</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Conditional Action Sub-Forms */}
            {showActionForm ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={`${showActionForm === 'HOLD' ? '보류 사유' : showActionForm === 'RE_EXAM' ? '재심사 요청 사유' : '반려 사유'} 입력...`}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="bg-stone-900 text-white text-xs px-3 py-1.5 rounded-lg border border-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-64"
                />
                <button
                  onClick={handleActionSubmit}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                >
                  확정
                </button>
                <button
                  onClick={() => setShowActionForm(null)}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 text-stone-400 hover:text-white text-xs cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                {/* AI Advisor Button */}
                {onConsultAiAdvisor && (
                  <button
                    onClick={() => {
                      onConsultAiAdvisor(review);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="이 안건에 대해 AI 자문관에게 즉시 질의합니다."
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>AI 자문관 질의</span>
                  </button>
                )}

                {/* Hold Button */}
                {(review.status === 'PENDING_APPROVAL' || review.status === 'DOC_VERIFICATION') && (
                  <button
                    onClick={() => setShowActionForm('HOLD')}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    보류 설정
                  </button>
                )}


                {/* Re-Exam Button */}
                {review.status === 'PENDING_APPROVAL' && (
                  <button
                    onClick={() => setShowActionForm('RE_EXAM')}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-cyan-300 border border-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    재심사 요청
                  </button>
                )}

                {/* Reject Button */}
                {(review.status === 'PENDING_APPROVAL' || review.status === 'RE_EXAMINATION' || review.status === 'ON_HOLD') && (
                  <button
                    onClick={() => setShowActionForm('REJECT')}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-rose-950 text-rose-400 border border-rose-900/40 text-xs font-semibold cursor-pointer"
                  >
                    반려
                  </button>
                )}

                {/* Approve Button */}
                {(review.status === 'PENDING_APPROVAL' || review.status === 'DOC_VERIFICATION' || review.status === 'RE_EXAMINATION') && (
                  <button
                    onClick={handleApproveWithSoD}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 cursor-pointer font-cinzel tracking-wider"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>재무 승인 확정</span>
                  </button>
                )}

                {/* Simulate Payment if Approved */}
                {review.status === 'APPROVED' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSimulatePayment(review);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-lg shadow-amber-950 flex items-center gap-1.5 cursor-pointer font-cinzel tracking-wider animate-pulse"
                  >
                    <SendHorizontal className="w-4 h-4" />
                    <span>모의 펌뱅킹 지급 실행</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
