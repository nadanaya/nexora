import React from 'react';
import { 
  ClipboardCheck, 
  Clock, 
  CircleDollarSign, 
  Network, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { RebateReview, FollowUpTask } from '../types';

interface DashboardStatsProps {
  reviews: RebateReview[];
  tasks: FollowUpTask[];
  onSelectTab: (tabId: 'reviews' | 'tasks' | 'network' | 'audit') => void;
  onSetReviewStatusFilter?: (status: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  reviews,
  tasks,
  onSelectTab,
  onSetReviewStatusFilter,
}) => {
  // Compute dynamic stats
  const activeReviews = reviews.filter(
    (r) => r.status === 'PENDING_APPROVAL' || r.status === 'DOC_VERIFICATION' || r.status === 'RE_EXAMINATION' || r.status === 'ON_HOLD'
  );
  const openTasks = tasks.filter((t) => t.status === 'OPEN');

  const pendingCount = reviews.filter(r => r.status === 'PENDING_APPROVAL').length;
  const docVerificationCount = reviews.filter(r => r.status === 'DOC_VERIFICATION').length;
  const reExaminationCount = reviews.filter(r => r.status === 'RE_EXAMINATION').length;
  const onHoldCount = reviews.filter(r => r.status === 'ON_HOLD').length;

  const salesTasksCount = openTasks.filter(t => t.assigneeRole === 'SALES').length;
  const financeTasksCount = openTasks.filter(t => t.assigneeRole === 'FINANCE').length;
  const auditTasksCount = openTasks.filter(t => t.assigneeRole === 'AUDIT').length;

  const totalRebateAmount = reviews
    .filter(r => r.dataSource === 'DEMO')
    .reduce((sum, r) => sum + r.calculatedRebateAmount, 0);

  const relatedPartiesCount = reviews
    .filter(r => r.dataSource === 'DEMO' && r.isRelatedParty).length;
  const demoTotal = reviews.filter(r => r.dataSource === 'DEMO').length || 1;
  const relatedRatio = Math.round((relatedPartiesCount / demoTotal) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Active Reviews (진행 심사 5건) */}
      <div 
        onClick={() => {
          if (onSetReviewStatusFilter) onSetReviewStatusFilter('ACTIVE');
          onSelectTab('reviews');
        }}
        className="group relative bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
              DEMO
            </span>
            <span className="text-xs font-semibold text-slate-300">진행 심사</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <div className="text-3xl font-black text-white tracking-tight">
            {activeReviews.length}
            <span className="text-lg font-semibold text-slate-400 ml-1">건</span>
          </div>
          <span className="text-[11px] text-amber-400 font-medium">
            (승인 처리 대기 중)
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-300">대기 {pendingCount}</span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400">증빙 {docVerificationCount}</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400">재심사 {reExaminationCount}</span>
            <span className="text-slate-600">·</span>
            <span className="text-rose-400">보류 {onHoldCount}</span>
          </div>
          <span className="inline-flex items-center text-amber-400 group-hover:translate-x-1 transition-transform text-[11px] font-semibold">
            목록 열기 <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Card 2: Open Follow-Up Tasks (열린 후속 작업 4건) */}
      <div 
        onClick={() => onSelectTab('tasks')}
        className="group relative bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 tracking-wider">
              DEMO
            </span>
            <span className="text-xs font-semibold text-slate-300">열린 후속 작업</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <div className="text-3xl font-black text-white tracking-tight">
            {openTasks.length}
            <span className="text-lg font-semibold text-slate-400 ml-1">건</span>
          </div>
          <span className="text-[11px] text-indigo-400 font-medium">
            (영업·재무 실행 연결)
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <div className="text-[11px] text-slate-300">
            영업 소명 {salesTasksCount}건 · 재무/감사 {financeTasksCount + auditTasksCount}건
          </div>
          <span className="inline-flex items-center text-indigo-400 group-hover:translate-x-1 transition-transform text-[11px] font-semibold">
            작업 처리 <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Card 3: Monthly Rebate Amount Under Review */}
      <div 
        onClick={() => {
          if (onSetReviewStatusFilter) onSetReviewStatusFilter('ALL');
          onSelectTab('reviews');
        }}
        className="group relative bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              Q3 실적 심사
            </span>
            <span className="text-xs font-semibold text-slate-300">신청 장려금 총액</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <div className="text-2xl font-black text-white tracking-tight">
            ₩{(totalRebateAmount / 100000000).toFixed(2)}
            <span className="text-sm font-semibold text-slate-400 ml-1">억원</span>
          </div>
          <span className="text-[11px] text-slate-400">
            (총 5개 거래처)
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span className="text-[11px] text-slate-300">Corevia Q3 B2B 매출 기반</span>
          <span className="inline-flex items-center text-rose-400 group-hover:translate-x-1 transition-transform text-[11px] font-semibold">
            산식 검산 <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Card 4: Related Parties Detection Ratio */}
      <div 
        onClick={() => onSelectTab('network')}
        className="group relative bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              AI 통제
            </span>
            <span className="text-xs font-semibold text-slate-300">특수관계 거래처 탐지</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Network className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            {relatedRatio}%
          </div>
          <span className="text-[11px] text-slate-400">
            (3 / 5건 식별)
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span className="text-[11px] text-slate-300">마실커머스/Celtonic 지분</span>
          <span className="inline-flex items-center text-emerald-400 group-hover:translate-x-1 transition-transform text-[11px] font-semibold">
            관계망 보기 <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
