import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Eye, 
  DollarSign, 
  ArrowUpDown,
  Building2,
  Tag,
  ShieldAlert,
  SendHorizontal,
  Scale
} from 'lucide-react';
import { RebateReview, UserProfile, ReviewStatus, DataSourceType } from '../types';

interface ReviewsListProps {
  reviews: RebateReview[];
  currentUser: UserProfile;
  onOpenDetailModal: (review: RebateReview) => void;
  onApproveReview: (reviewId: string) => void;
  onRejectReview: (reviewId: string, reason: string) => void;
  onOpenSimulatePayment: (review: RebateReview) => void;
  onRunAiAnalysis: (reviewId: string) => void;
  isAnalyzingId?: string | null;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onShowSoDAlert: (data: { attemptedAction: string; reviewCode?: string; vendorName?: string; customMessage?: string }) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  currentUser,
  onOpenDetailModal,
  onApproveReview,
  onRejectReview,
  onOpenSimulatePayment,
  onRunAiAnalysis,
  isAnalyzingId,
  statusFilter,
  onStatusFilterChange,
  onShowSoDAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'DEMO' | 'W07_ACTUAL'>('ALL');
  const [rejectModalReview, setRejectModalReview] = useState<RebateReview | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Filter items
  const filteredReviews = reviews.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      r.vendorName.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.productLine.toLowerCase().includes(q) ||
      r.vendorCategory.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (sourceFilter !== 'ALL' && r.dataSource !== sourceFilter) {
      return false;
    }

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') {
      return r.status === 'PENDING_APPROVAL' || r.status === 'DOC_VERIFICATION' || r.status === 'RE_EXAMINATION' || r.status === 'ON_HOLD';
    }
    return r.status === statusFilter;
  });

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            승인 대기
          </span>
        );
      case 'DOC_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <Clock className="w-3 h-3 text-cyan-400" />
            증빙 확인
          </span>
        );
      case 'RE_EXAMINATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <ArrowUpDown className="w-3 h-3 text-purple-400" />
            재심사
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            보류
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            승인 완료
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
            <DollarSign className="w-3 h-3 text-blue-400" />
            지급 완료
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-800 text-stone-300 border border-stone-700">
            <XCircle className="w-3 h-3 text-rose-400" />
            반려/거절
          </span>
        );
    }
  };

  const handleApproveClick = (review: RebateReview) => {
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
        customMessage: `등록 수취계좌 예금주 상호 불일치 상태입니다. 제3자 부정 지급을 방지하기 위해 계좌 실명 증빙 보완 전까지 승인이 통제됩니다.`,
      });
      return;
    }

    onApproveReview(review.id);
  };

  const handleRejectSubmit = () => {
    if (!rejectModalReview) return;
    if (!rejectionReasonText.trim()) {
      alert('반려 사유를 입력해 주세요.');
      return;
    }
    onRejectReview(rejectModalReview.id, rejectionReasonText.trim());
    setRejectModalReview(null);
    setRejectionReasonText('');
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Controls - Executive Sincere Bar */}
      <div className="bg-[#090e18] border border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <button
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50 shadow-md'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-transparent'
            }`}
          >
            전체 ({reviews.length})
          </button>
          <button
            onClick={() => onStatusFilterChange('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
                : 'bg-stone-900 text-amber-300/80 hover:bg-stone-800 border border-transparent'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            진행 심사 ({reviews.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'DOC_VERIFICATION' || r.status === 'RE_EXAMINATION' || r.status === 'ON_HOLD').length})
          </button>
          <button
            onClick={() => onStatusFilterChange('PENDING_APPROVAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'PENDING_APPROVAL'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-900/80 text-stone-400 hover:bg-stone-800'
            }`}
          >
            대기 ({reviews.filter(r => r.status === 'PENDING_APPROVAL').length})
          </button>
          <button
            onClick={() => onStatusFilterChange('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-900/80 text-stone-400 hover:bg-stone-800'
            }`}
          >
            승인 완료 ({reviews.filter(r => r.status === 'APPROVED').length})
          </button>
          <button
            onClick={() => onStatusFilterChange('PAID')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === 'PAID'
                ? 'bg-blue-600 text-white'
                : 'bg-stone-900/80 text-stone-400 hover:bg-stone-800'
            }`}
          >
            지급 완료 ({reviews.filter(r => r.status === 'PAID').length})
          </button>
        </div>

        {/* Source & Search Filters */}
        <div className="flex items-center gap-2">
          {/* Source Filter */}
          <div className="flex items-center rounded-lg bg-stone-900 p-0.5 border border-stone-800 text-xs">
            <button
              onClick={() => setSourceFilter('ALL')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                sourceFilter === 'ALL' ? 'bg-stone-800 text-stone-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              출처 전체
            </button>
            <button
              onClick={() => setSourceFilter('DEMO')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                sourceFilter === 'DEMO' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              DEMO (시연)
            </button>
            <button
              onClick={() => setSourceFilter('W07_ACTUAL')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                sourceFilter === 'W07_ACTUAL' ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              W07 원본
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <input
              type="text"
              placeholder="거래처명, 코드, 제품군 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 text-stone-200 placeholder-stone-500 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Structured Legal Docket Table */}
      <div className="bg-[#090e18] border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-[#05080f] text-[11px] text-stone-400 font-cinzel font-semibold uppercase tracking-wider border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">DOCKET / ID</th>
                <th className="py-3 px-4">VENDOR & PRODUCT LINE</th>
                <th className="py-3 px-4 text-right">Q3 TARGET / ACTUAL</th>
                <th className="py-3 px-4 text-right">RATE / REBATE LIABILITY</th>
                <th className="py-3 px-4">STATUS / RISK</th>
                <th className="py-3 px-4">RELATION & BANK</th>
                <th className="py-3 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500 font-editorial text-sm">
                    일치하는 판매장려금 심사 건이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr 
                    key={review.id}
                    className="hover:bg-stone-900/40 transition group"
                  >
                    {/* Source & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {review.dataSource === 'DEMO' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              DEMO
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              W07 원본
                            </span>
                          )}
                          <span className="font-mono text-amber-300 font-bold">{review.code}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-sans">{review.requestedDate} 기안</span>
                      </div>
                    </td>

                    {/* Vendor Name & Product (Editorial Serif) */}
                    <td className="py-3.5 px-4">
                      <div className="font-editorial font-bold text-stone-100 text-sm">
                        {review.vendorName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400 font-sans">
                        <span className="px-1.5 py-0.2 rounded bg-stone-900 text-stone-300 border border-stone-800">
                          {review.vendorCategory}
                        </span>
                        <span>{review.productLine}</span>
                      </div>
                    </td>

                    {/* Target / Actual Sales */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-medium text-stone-200 font-sans">
                        ₩{(review.actualSalesAmount / 100000000).toFixed(2)}억
                        <span className="text-[10px] text-stone-400 ml-1">
                          (목표 {(review.targetSalesAmount / 100000000).toFixed(1)}억)
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-400 mt-0.5 font-sans">
                        달성률 {review.achievementRate}%
                      </div>
                    </td>

                    {/* Rebate Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-editorial font-bold text-rose-300 text-base">
                        ₩{review.calculatedRebateAmount.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 font-sans">
                        계약 요율 {review.contractRebateRate}%
                      </div>
                    </td>

                    {/* Status & AI Risk */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(review.status)}
                        {review.aiAnalysis ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                            review.aiAnalysis.riskLevel === 'CRITICAL' ? 'bg-rose-950/60 text-rose-300 border border-rose-600/40' :
                            review.aiAnalysis.riskLevel === 'HIGH' ? 'bg-orange-950/60 text-orange-300 border border-orange-600/40' :
                            review.aiAnalysis.riskLevel === 'MEDIUM' ? 'bg-amber-950/60 text-amber-300 border border-amber-600/40' :
                            'bg-emerald-950/60 text-emerald-300 border border-emerald-600/40'
                          }`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            위험도 {review.aiAnalysis.riskLevel} ({review.aiAnalysis.riskScore}점)
                          </span>
                        ) : (
                          <button
                            onClick={() => onRunAiAnalysis(review.id)}
                            disabled={isAnalyzingId === review.id}
                            className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer font-sans"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {isAnalyzingId === review.id ? '분석 중...' : 'AI 검산 실행'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Related Party & Bank Account */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        {review.isRelatedParty ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold" title={review.relationDetail}>
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            특수관계 감지
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                            <CheckCircle2 className="w-3 h-3 text-stone-500" />
                            일반 거래처
                          </span>
                        )}

                        {review.accountVerified ? (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            ✓ 계좌 실명 일치
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-bold">
                            ⚠ 계좌 상호 불일치
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Detail Modal Button */}
                        <button
                          onClick={() => onOpenDetailModal(review)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700 font-medium transition cursor-pointer flex items-center gap-1"
                          title="계약 산식 및 AI 정밀 분석 상세 보기"
                        >
                          <Eye className="w-3 h-3 text-stone-400" />
                          <span>상세</span>
                        </button>

                        {/* Approve Button */}
                        {(review.status === 'PENDING_APPROVAL' || review.status === 'RE_EXAMINATION' || review.status === 'DOC_VERIFICATION') && (
                          <button
                            onClick={() => handleApproveClick(review)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                            title="재무 승인 처리 (SoD 검증)"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>승인</span>
                          </button>
                        )}

                        {/* Reject Button */}
                        {(review.status === 'PENDING_APPROVAL' || review.status === 'RE_EXAMINATION' || review.status === 'DOC_VERIFICATION' || review.status === 'ON_HOLD') && (
                          <button
                            onClick={() => {
                              setRejectModalReview(review);
                              setRejectionReasonText('');
                            }}
                            className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-rose-950 text-rose-400 hover:text-rose-300 border border-rose-900/40 font-medium transition cursor-pointer"
                            title="심사 반려 / 거절"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        )}

                        {/* Simulate Wire Transfer Button */}
                        {review.status === 'APPROVED' && (
                          <button
                            onClick={() => onOpenSimulatePayment(review)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold transition cursor-pointer flex items-center gap-1 shadow-lg shadow-amber-950 animate-pulse"
                            title="Corevia 펌뱅킹 모의 지급 실행"
                          >
                            <SendHorizontal className="w-3 h-3" />
                            <span>모의지급</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModalReview && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1a] border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-cinzel font-bold text-sm tracking-wider">
              <ShieldAlert className="w-5 h-5" />
              <span>판매장려금 심사 반려 / 거절 사유서</span>
            </div>
            <p className="text-xs text-stone-300">
              대상: <strong className="font-editorial text-white text-sm">{rejectModalReview.vendorName}</strong> ({rejectModalReview.code})
            </p>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                반려 사유 (영업부 및 감사 대장에 영구 기록됩니다):
              </label>
              <textarea
                rows={3}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="예: 특수관계자 내부거래 요건 미충족, 수취계좌 불일치 미해소 등..."
                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalReview(null)}
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs font-medium cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
