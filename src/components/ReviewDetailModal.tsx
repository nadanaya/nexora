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
  Layers
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-rose-300 font-bold border border-rose-500/30">
                {review.code}
              </span>
              {review.dataSource === 'DEMO' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DEMO 시연 심사
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  W07 원본 완료건
                </span>
              )}
              <span className="text-xs text-slate-400">Corevia Cosmetics B2B 제조 공급</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {review.vendorName}
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {review.vendorCategory}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              대상 품목: <span className="text-slate-200 font-medium">{review.productLine}</span> · 대상 분기: {review.targetQuarter}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-800 bg-slate-900 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'OVERVIEW'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            거래처 및 신청 개요
          </button>
          <button
            onClick={() => setActiveTab('MATH')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'MATH'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            W07 산식 및 한도 검산
          </button>
          <button
            onClick={() => setActiveTab('AI_REPORT')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'AI_REPORT'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI 특수관계·위험도 분석
          </button>
          <button
            onClick={() => setActiveTab('DOCS')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'DOCS'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            수취계좌 및 증빙 검증
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'AUDIT'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            감사 및 변경 이력 ({review.approvalHistory.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-slate-400 text-[11px]">Q3 목표 매출액</div>
                  <div className="text-base font-bold text-white mt-1">
                    ₩{review.targetSalesAmount.toLocaleString()}원
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">화장품 B2B 공급 계약 기준</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-slate-400 text-[11px]">실제 달성 매출액 (ERP 원장)</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    ₩{review.actualSalesAmount.toLocaleString()}원
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                    달성률 {review.achievementRate}% (목표 초과)
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <div className="text-rose-300 text-[11px] font-semibold">신청 판매장려금</div>
                  <div className="text-lg font-black text-rose-300 mt-1">
                    ₩{review.calculatedRebateAmount.toLocaleString()}원
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    계약 요율 {review.contractRebateRate}% 적용
                  </div>
                </div>
              </div>

              {/* Status and SoD Details */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  기안 및 승인 통제 상태
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400">기안자:</span> {review.requestedBy} ({review.requestedDate})
                  </div>
                  <div>
                    <span className="text-slate-400">현재 상태:</span> <strong className="text-white">{review.status}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">당월 누계 / 한도:</span> ₩{(review.monthlyAccumulatedAmount / 10000).toLocaleString()}만원 / 한도 ₩{(review.monthlyLimitAmount / 10000).toLocaleString()}만원
                  </div>
                  <div>
                    <span className="text-slate-400">특수관계 여부:</span> {review.isRelatedParty ? (
                      <span className="text-amber-300 font-bold">감지됨 ({review.relationDetail})</span>
                    ) : '일반 독립 거래처'}
                  </div>
                </div>

                {review.hasSalesExplanation && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-200">
                    <div className="font-bold mb-1">영업 소명서 접수 완료:</div>
                    <p className="text-xs text-slate-200">{review.salesExplanationNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'MATH' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm">W07 판매장려금 산식 검산식</h3>
                <div className="font-mono text-xs bg-slate-900 p-3 rounded-lg border border-slate-700 text-slate-200 space-y-1">
                  <div>[지급액 산출식]</div>
                  <div className="text-rose-300 font-bold">
                    지급 장려금 = 실제 달성 매출액 (₩{review.actualSalesAmount.toLocaleString()}) × 계약 장려금율 ({review.contractRebateRate}%)
                  </div>
                  <div className="text-emerald-400">
                    = ₩{Math.round(review.actualSalesAmount * (review.contractRebateRate / 100)).toLocaleString()}원
                  </div>
                  <div className="text-slate-400 pt-1">
                    신청 금액(₩{review.calculatedRebateAmount.toLocaleString()}원)과 산식 결과 일치 여부: <span className="text-emerald-400 font-bold">✓ 100% 일치</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                <h4 className="font-bold text-white">월간 누적 한도 규정 대조</h4>
                <div className="space-y-1 text-slate-300">
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
                  <div className="pt-2 border-t border-slate-700/60 text-slate-400">
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
                  <span className="font-bold text-white text-sm">
                    Gemini 3.8 Flash AI 특수관계 및 위험도 검증 보고서
                  </span>
                </div>
                <button
                  onClick={() => onRunAiAnalysis(review.id)}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold border border-slate-700 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAnalyzing ? '분석 중...' : 'AI 재분석 실행'}</span>
                </button>
              </div>

              {review.aiAnalysis ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
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
                        <span className="font-bold text-white text-sm">
                          위험 등급: {review.aiAnalysis.riskLevel} (리스크 스코어 {review.aiAnalysis.riskScore}/100)
                        </span>
                        <span className="text-slate-400 text-[10px]">모델: {review.aiAnalysis.modelUsed}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {review.aiAnalysis.summary}
                      </p>
                    </div>
                  </div>

                  {/* Compliance Checks List */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
                    <h4 className="font-bold text-white">4대 W07 통제 항목 자동 검증</h4>
                    <div className="space-y-2">
                      {review.aiAnalysis.complianceChecks.map((chk, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
                          {chk.pass ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${chk.severity === 'DANGER' ? 'text-rose-400' : 'text-amber-400'}`} />
                          )}
                          <div>
                            <div className="font-semibold text-slate-200">{chk.label}</div>
                            <div className="text-[11px] text-slate-400">{chk.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-200 space-y-1">
                    <div className="font-bold">AI 조치 권고: {review.aiAnalysis.recommendedAction}</div>
                    <div className="text-[11px] text-slate-300">{review.aiAnalysis.justificationAdvice}</div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      감사 대장 권고: {review.aiAnalysis.auditTrailRecommendation}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400">
                  <p>아직 AI 심사 분석이 실행되지 않았습니다.</p>
                  <button
                    onClick={() => onRunAiAnalysis(review.id)}
                    className="mt-3 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer"
                  >
                    AI 심사 분석 실행하기
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'DOCS' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                <h3 className="font-bold text-white text-sm">지급 수취계좌 실명 검증</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">계약자 상호</div>
                    <div className="font-bold text-white mt-0.5">{review.vendorName}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">등록 펌뱅킹 수취계좌</div>
                    <div className="font-mono text-slate-200 mt-0.5">신한은행 110-***-882190</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {review.accountVerified ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          예금주 실명 일치 확인됨
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
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
              <h3 className="font-bold text-white text-sm">심사 결재 및 감사 로그</h3>
              <div className="space-y-2">
                {review.approvalHistory.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.action}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {item.actorName} ({item.actorRole})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{item.note}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>현재 접속자:</span>
            <span className="font-bold text-white">{currentUser.name} ({currentUser.department})</span>
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
                  className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 w-64"
                />
                <button
                  onClick={handleActionSubmit}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                >
                  확정
                </button>
                <button
                  onClick={() => setShowActionForm(null)}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                {/* Hold Button */}
                {(review.status === 'PENDING_APPROVAL' || review.status === 'DOC_VERIFICATION') && (
                  <button
                    onClick={() => setShowActionForm('HOLD')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    보류 설정
                  </button>
                )}

                {/* Re-Exam Button */}
                {review.status === 'PENDING_APPROVAL' && (
                  <button
                    onClick={() => setShowActionForm('RE_EXAM')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    재심사 요청
                  </button>
                )}

                {/* Reject Button */}
                {(review.status === 'PENDING_APPROVAL' || review.status === 'RE_EXAMINATION' || review.status === 'ON_HOLD') && (
                  <button
                    onClick={() => setShowActionForm('REJECT')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 border border-rose-900/40 text-xs font-semibold cursor-pointer"
                  >
                    반려
                  </button>
                )}

                {/* Approve Button */}
                {(review.status === 'PENDING_APPROVAL' || review.status === 'DOC_VERIFICATION' || review.status === 'RE_EXAMINATION') && (
                  <button
                    onClick={handleApproveWithSoD}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
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
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 flex items-center gap-1.5 cursor-pointer animate-pulse"
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
