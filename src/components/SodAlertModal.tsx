import React from 'react';
import { 
  ShieldAlert, 
  X, 
  UserCheck, 
  UserX, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  FileCheck2,
  Lock,
  Sparkles
} from 'lucide-react';
import { UserProfile, SodAlertData } from '../types';
import { USER_PROFILES } from '../data/initialData';

interface SodAlertModalProps {
  isOpen: boolean;
  alertData: SodAlertData | null;
  currentUser: UserProfile;
  onClose: () => void;
  onSwitchUser: (user: UserProfile) => void;
  onProceedAfterSwitch?: () => void;
}

export const SodAlertModal: React.FC<SodAlertModalProps> = ({
  isOpen,
  alertData,
  currentUser,
  onClose,
  onSwitchUser,
  onProceedAfterSwitch,
}) => {
  if (!isOpen || !alertData) return null;

  const financeApprover = USER_PROFILES.find((u) => u.role === 'FINANCE') || USER_PROFILES[1];

  const handleInstantSwitch = () => {
    onSwitchUser(financeApprover);
    onClose();
    if (onProceedAfterSwitch) {
      onProceedAfterSwitch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-2xl w-full my-auto shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                  SoD 통제 위반 경고
                </span>
                <span className="text-xs text-slate-400">
                  Aurora 내부회계관리제도 규정 제4조 (기안-승인 분리 원칙)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                직무 분리(Segregation of Duties) 통제 위반 감지
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attempted Action Context Banner */}
        <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">시도한 작업:</span>
            <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {alertData.attemptedAction}
            </span>
            {alertData.vendorName && (
              <span className="text-slate-300 font-medium">
                · 대상 거래처: <strong className="text-white">{alertData.vendorName}</strong>
              </span>
            )}
          </div>
          {alertData.reviewCode && (
            <span className="font-mono text-[11px] text-rose-300 bg-slate-800 px-2 py-0.5 rounded font-bold">
              {alertData.reviewCode}
            </span>
          )}
        </div>

        {/* 2-Column Comparative Table UI */}
        <div className="p-5 space-y-4 text-xs">
          <div className="text-slate-300 leading-relaxed text-xs">
            {alertData.customMessage || (
              <span>
                화장품 제조사 <strong className="text-rose-300">Corevia Cosmetics</strong>의 판매장려금(Rebate) 지급 승인은 
                영업 기안자의 셀프 결재를 엄격히 금지하며, 독립된 재무승인자 또는 내부감시자의 상호 견제 검증을 거쳐야 합니다.
              </span>
            )}
          </div>

          {/* Comparative 2-Column Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60 shadow-inner">
            <table className="w-full text-left text-xs">
              {/* Table Column Headers */}
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 bg-slate-900/90 text-slate-400 w-28 border-r border-slate-800/80">
                    비교 평가 항목
                  </th>
                  <th className="py-3 px-3.5 bg-rose-950/20 text-rose-300 w-1/2 border-r border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <UserX className="w-3.5 h-3.5 text-rose-400" />
                        현재 사용자 역할 (Current User)
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {currentUser.role}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3.5 bg-emerald-950/20 text-emerald-300 w-1/2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        필수 승인자 역할 (Required Approver)
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        FINANCE / AUDIT
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body Rows */}
              <tbody className="divide-y divide-slate-800/60">
                {/* Row 1: Profile & Title */}
                <tr className="hover:bg-slate-900/30 transition">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-400 bg-slate-900/40 border-r border-slate-800/80">
                    1. 담당자 및 직무
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-200 border-r border-slate-800/80">
                    <div className="font-bold text-white">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400">{currentUser.department}</div>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-200 bg-emerald-950/5">
                    <div className="font-bold text-emerald-300">이재무 과장 / 박감사 팀장</div>
                    <div className="text-[11px] text-slate-300">Corevia 재무자금팀 / Aurora 감사팀</div>
                  </td>
                </tr>

                {/* Row 2: Approval Authority */}
                <tr className="hover:bg-slate-900/30 transition">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-400 bg-slate-900/40 border-r border-slate-800/80">
                    2. 승인 권한 여부
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-800/80">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      ❌ 승인 권한 없음 (기안 전용)
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 bg-emerald-950/5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ✅ 자금 집행 전결 승인권 보유
                    </span>
                  </td>
                </tr>

                {/* Row 3: Role Function & Primary Duty */}
                <tr className="hover:bg-slate-900/30 transition">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-400 bg-slate-900/40 border-r border-slate-800/80">
                    3. 주관 업무 성격
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 border-r border-slate-800/80">
                    화장품 B2B 거래처 영업 계약, Q3 목표/실적 집계, 장려금 기안 신청
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 bg-emerald-950/5">
                    계약 요율 산식 검산, 수취계좌 실명 증빙 대조, 펌뱅킹 송금 집행
                  </td>
                </tr>

                {/* Row 4: SoD Conflict Reason */}
                <tr className="hover:bg-slate-900/30 transition">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-400 bg-slate-900/40 border-r border-slate-800/80">
                    4. 내부통제 충돌 분석
                  </td>
                  <td className="py-2.5 px-3.5 text-rose-300 border-r border-slate-800/80">
                    기안자 본인이 승인할 경우, <strong>실적 부풀리기 및 부당 리베이트 자의적 지급 위험</strong> 발생
                  </td>
                  <td className="py-2.5 px-3.5 text-emerald-300 bg-emerald-950/5">
                    영업 실적과 독립된 제3자가 <strong>ERP 원장과 금융 증빙을 대조하여 상호 견제</strong> 달성
                  </td>
                </tr>

                {/* Row 5: Required Action */}
                <tr className="hover:bg-slate-900/30 transition">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-400 bg-slate-900/40 border-r border-slate-800/80">
                    5. 권장 조치
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-400 border-r border-slate-800/80">
                    단독 결재 시도 중단 및 기안 상태 유지
                  </td>
                  <td className="py-2.5 px-3.5 font-medium text-emerald-200 bg-emerald-950/5">
                    <strong>재무승인자(이재무 과장)</strong> 권한으로 심사 후 승인 확정
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Resolution Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-slate-900 to-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs">
                  원클릭 역할 전환으로 즉시 승인 진행 가능
                </div>
                <div className="text-[11px] text-slate-300">
                  시연 편의를 위해 승인 전결권을 가진 <strong>[이재무 과장]</strong> 역할로 즉시 전환할 수 있습니다.
                </div>
              </div>
            </div>

            <button
              onClick={handleInstantSwitch}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-950 shrink-0"
            >
              <span>💼 이재무 과장으로 전환</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-[11px]">
            ※ 직무 분리 통제는 감사 대장(Audit Trail)에 차단 이력으로 기록됩니다.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
