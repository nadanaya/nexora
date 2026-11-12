import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Send, 
  UserCheck, 
  ShieldCheck, 
  Building2,
  Check,
  RotateCcw
} from 'lucide-react';
import { FollowUpTask, UserProfile } from '../types';

interface FollowUpTasksListProps {
  tasks: FollowUpTask[];
  currentUser: UserProfile;
  onResolveTask: (taskId: string, submissionNote?: string) => void;
  onOpenReviewDetailByCode?: (reviewCode: string) => void;
}

export const FollowUpTasksList: React.FC<FollowUpTasksListProps> = ({
  tasks,
  currentUser,
  onResolveTask,
  onOpenReviewDetailByCode,
}) => {
  const [activeTaskForModal, setActiveTaskForModal] = useState<FollowUpTask | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SALES' | 'FINANCE' | 'AUDIT'>('ALL');

  const filteredTasks = tasks.filter((t) => {
    if (roleFilter !== 'ALL' && t.assigneeRole !== roleFilter) return false;
    return true;
  });

  const handleOpenAction = (task: FollowUpTask) => {
    setActiveTaskForModal(task);
    setSubmissionText('');
  };

  const handleConfirmAction = () => {
    if (!activeTaskForModal) return;
    if (!submissionText.trim()) {
      alert('처리 내용 또는 소명 소견을 입력해 주세요.');
      return;
    }
    onResolveTask(activeTaskForModal.id, submissionText.trim());
    setActiveTaskForModal(null);
    setSubmissionText('');
  };

  return (
    <div className="space-y-4">
      {/* Header & Department Role Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            열린 후속 작업 목록 (영업 소명 · 재무 일정 · 감사 검토)
            <span className="px-2 py-0.5 rounded text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              DEMO 시연 {tasks.filter(t => t.status === 'OPEN').length}건 열림
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            화장품 거래처 심사 과정에서 발생한 부서 간 협업 및 소명 의사결정 파이프라인입니다.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
              roleFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            전체 ({tasks.length})
          </button>
          <button
            onClick={() => setRoleFilter('SALES')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
              roleFilter === 'SALES' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            영업 소명 ({tasks.filter(t => t.assigneeRole === 'SALES').length})
          </button>
          <button
            onClick={() => setRoleFilter('FINANCE')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
              roleFilter === 'FINANCE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            재무 일정 ({tasks.filter(t => t.assigneeRole === 'FINANCE').length})
          </button>
          <button
            onClick={() => setRoleFilter('AUDIT')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
              roleFilter === 'AUDIT' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            감사 보고 ({tasks.filter(t => t.assigneeRole === 'AUDIT').length})
          </button>
        </div>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const isResolved = task.status === 'RESOLVED';

          return (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border transition shadow-lg flex flex-col justify-between ${
                isResolved
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      DEMO
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      task.type === 'SALES_EXPLANATION' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      task.type === 'FINANCE_SCHEDULE' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      task.type === 'BANK_DOC_VERIFICATION' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {task.type === 'SALES_EXPLANATION' ? '영업 소명 과제' :
                       task.type === 'FINANCE_SCHEDULE' ? '재무 일정 배정' :
                       task.type === 'BANK_DOC_VERIFICATION' ? '계좌 증빙 보완' : '감사위원회 사전보고'}
                    </span>
                    {task.reviewCode && (
                      <button
                        onClick={() => onOpenReviewDetailByCode && onOpenReviewDetailByCode(task.reviewCode!)}
                        className="font-mono text-[11px] text-slate-400 hover:text-rose-300 underline cursor-pointer"
                      >
                        {task.reviewCode}
                      </button>
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isResolved
                      ? 'bg-slate-800 text-slate-400'
                      : task.priority === 'URGENT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {isResolved ? '처리 완료' : task.priority === 'URGENT' ? '긴급 (D-1)' : '진행 중'}
                  </span>
                </div>

                {/* Title & Vendor */}
                <h3 className={`text-sm font-bold tracking-tight ${isResolved ? 'line-through text-slate-400' : 'text-white'}`}>
                  {task.title}
                </h3>
                <div className="text-xs text-rose-300/90 font-medium mt-1">
                  거래처: {task.vendorName}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  {task.description}
                </p>

                {/* Resolved Note if available */}
                {isResolved && task.submissionNote && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs">
                    <div className="font-semibold flex items-center gap-1 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      처리 결과 증빙:
                    </div>
                    <p className="text-slate-300">{task.submissionNote}</p>
                    <div className="text-[10px] text-slate-400 mt-1">완료 일시: {task.resolvedAt}</div>
                  </div>
                )}
              </div>

              {/* Footer info & Action button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>{task.assigneeName}</span>
                  <span className="text-slate-600">·</span>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>기한: {task.dueDate}</span>
                </div>

                {!isResolved ? (
                  <button
                    onClick={() => handleOpenAction(task)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-950"
                  >
                    <span>{task.type === 'SALES_EXPLANATION' ? '소명서 제출' : task.type === 'FINANCE_SCHEDULE' ? '일정 확정' : '작업 완료'}</span>
                    <Send className="w-3 h-3 ml-0.5" />
                  </button>
                ) : (
                  <span className="text-slate-500 font-semibold text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    완료됨
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Submission Modal */}
      {activeTaskForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
              <FileText className="w-5 h-5" />
              <span>{activeTaskForModal.type === 'SALES_EXPLANATION' ? '영업부 소명서 작성 및 보완 제출' : '후속 작업 실행 및 증빙 등록'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">과제: <span className="text-white font-bold">{activeTaskForModal.title}</span></div>
              <div className="text-slate-400">대상 거래처: <span className="text-rose-300 font-semibold">{activeTaskForModal.vendorName}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {activeTaskForModal.type === 'SALES_EXPLANATION' 
                  ? '영업 소명 내용 및 매출 증빙 요약 (재무팀 심사위원 확인용):' 
                  : '처리 상세 내역 및 집행 일정:'}
              </label>
              <textarea
                rows={4}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder={activeTaskForModal.type === 'SALES_EXPLANATION' 
                  ? '예: 올리브영 전국 1,200개 매장 추석 특별 매대 선점으로 인한 일시적 매출 폭증이며, Q4 장려금 차감 정산에 합의함 (ERP 세금계산서 첨부).' 
                  : '예: Corevia 10월 2차 정기 펌뱅킹 지급 배치(11/15)에 등록 완료 및 집행 예산 배정 확정.'}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveTaskForModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
              >
                제출 및 작업 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
