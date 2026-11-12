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
  Sparkles,
  Scale,
  FileCheck2
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
        className="group relative bg-[#090e18] hover:bg-[#0c1322] border border-stone-800 hover:border-amber-500/50 p-5 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-[10px] text-amber-400 font-bold tracking-wider">
                LEDGER I.
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                DEMO
              </span>
              <span className="text-xs font-semibold text-stone-300">진행 심사</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 border border-stone-800 flex items-center justify-center group-hover:border-amber-500/50 transition">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-editorial text-3xl font-bold text-stone-100 tracking-tight">
              {activeReviews.length}
              <span className="text-base font-normal text-stone-400 ml-1">건</span>
            </div>
            <span className="text-[11px] text-amber-300/80 font-medium font-sans">
              (승인 결재 대기)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-400 flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-stone-300">대기 {pendingCount}</span>
            <span className="text-stone-600">·</span>
            <span className="text-amber-400">증빙 {docVerificationCount}</span>
            <span className="text-stone-600">·</span>
            <span className="text-cyan-400">재심 {reExaminationCount}</span>
            <span className="text-stone-600">·</span>
            <span className="text-rose-400">보류 {onHoldCount}</span>
          </div>
          <span className="inline-flex items-center text-amber-400 font-cinzel text-[11px] font-semibold group-hover:translate-x-1 transition-transform">
            조회 <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Card 2: Open Follow-Up Tasks (열린 후속 작업 4건) */}
      <div 
        onClick={() => onSelectTab('tasks')}
        className="group relative bg-[#090e18] hover:bg-[#0c1322] border border-stone-800 hover:border-indigo-500/50 p-5 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-[10px] text-indigo-400 font-bold tracking-wider">
                LEDGER II.
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                DEMO
              </span>
              <span className="text-xs font-semibold text-stone-300">열린 후속 작업</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-indigo-400 border border-stone-800 flex items-center justify-center group-hover:border-indigo-500/50 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-editorial text-3xl font-bold text-stone-100 tracking-tight">
              {openTasks.length}
              <span className="text-base font-normal text-stone-400 ml-1">건</span>
            </div>
            <span className="text-[11px] text-indigo-300/80 font-medium font-sans">
              (영업 소명·재무 일정)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-400 flex items-center justify-between">
          <div className="text-[11px] text-stone-300">
            영업 소명 {salesTasksCount}건 · 재무/감사 {financeTasksCount + auditTasksCount}건
          </div>
          <span className="inline-flex items-center text-indigo-400 font-cinzel text-[11px] font-semibold group-hover:translate-x-1 transition-transform">
            처리 <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Card 3: Monthly Rebate Amount Under Review */}
      <div 
        onClick={() => {
          if (onSetReviewStatusFilter) onSetReviewStatusFilter('ALL');
          onSelectTab('reviews');
        }}
        className="group relative bg-[#090e18] hover:bg-[#0c1322] border border-stone-800 hover:border-amber-500/50 p-5 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-[10px] text-rose-400 font-bold tracking-wider">
                LEDGER III.
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 font-sans">
                Q3 실적
              </span>
              <span className="text-xs font-semibold text-stone-300">장려금 총액</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-rose-400 border border-stone-800 flex items-center justify-center group-hover:border-rose-500/50 transition">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-1.5">
            <div className="font-editorial text-2xl font-bold text-stone-100 tracking-tight">
              ₩{(totalRebateAmount / 100000000).toFixed(2)}
              <span className="text-sm font-normal text-stone-400 ml-1 font-sans">억원</span>
            </div>
            <span className="text-[11px] text-stone-400 font-sans">
              (5개 B2B 거래처)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-400 flex items-center justify-between">
          <span className="text-[11px] text-stone-300">Corevia Q3 B2B 계약 기반</span>
          <span className="inline-flex items-center text-amber-400 font-cinzel text-[11px] font-semibold group-hover:translate-x-1 transition-transform">
            산식 <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Card 4: Related Parties Detection Ratio */}
      <div 
        onClick={() => onSelectTab('network')}
        className="group relative bg-[#090e18] hover:bg-[#0c1322] border border-stone-800 hover:border-emerald-500/50 p-5 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-[10px] text-emerald-400 font-bold tracking-wider">
                LEDGER IV.
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-sans">
                AI 통제
              </span>
              <span className="text-xs font-semibold text-stone-300">특수관계 탐지</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-emerald-400 border border-stone-800 flex items-center justify-center group-hover:border-emerald-500/50 transition">
              <Network className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-editorial text-3xl font-bold text-emerald-300 tracking-tight">
              {relatedRatio}%
            </div>
            <span className="text-[11px] text-stone-400 font-sans">
              (3 / 5건 식별)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-400 flex items-center justify-between">
          <span className="text-[11px] text-stone-300">마실커머스/Celtonic 지분</span>
          <span className="inline-flex items-center text-emerald-400 font-cinzel text-[11px] font-semibold group-hover:translate-x-1 transition-transform">
            망도 <ArrowRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
