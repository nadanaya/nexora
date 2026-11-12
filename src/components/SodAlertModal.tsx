import React from 'react';
import { 
  ShieldAlert, 
  X, 
  UserCheck, 
  UserX, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Building2,
  FileCheck2,
  Lock,
  Sparkles,
  ShieldCheck
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

interface SodRowItem {
  id: string;
  label: string;
  isConflict: boolean; // true = conflict (Red), false = compliant (Green)
  conflictReason: string;
  currentRole: {
    badgeText: string;
    isSatisfied: boolean;
    title: string;
    detail: string;
  };
  requiredRole: {
    badgeText: string;
    isSatisfied: boolean;
    title: string;
    detail: string;
  };
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

  const isSalesUser = currentUser.role === 'SALES';

  // 5 Detailed Comparative Items with explicit conflict / satisfaction definitions
  const comparisonRows: SodRowItem[] = [
    {
      id: 'row-authority',
      label: '1. 결재 및 승인 권한',
      isConflict: isSalesUser,
      conflictReason: '영업 기안자는 승인 전결권이 부여되지 않음',
      currentRole: {
        badgeText: '충돌 ❌ 승인 권한 없음',
        isSatisfied: false,
        title: '장려금 기안(Initiation) 전용',
        detail: '분기 판매 실적 집계 및 기안서 작성 권한만 보유 (자금 결재 불가)',
      },
      requiredRole: {
        badgeText: '충족 ✅ 전결 권한 보유',
        isSatisfied: true,
        title: '재무 승인자 (Finance Approver)',
        detail: 'Corevia 자금 집행 전결 규정에 따른 장려금 승인 전결권 보유',
      },
    },
    {
      id: 'row-sod-principle',
      label: '2. 직무 분리(SoD) 통제',
      isConflict: isSalesUser,
      conflictReason: '기안 주체와 결재 주체의 동일인 집행 금지',
      currentRole: {
        badgeText: '충돌 ❌ 자기 결재(Self-Approval) 위반',
        isSatisfied: false,
        title: '기안자 셀프 승인 시도 차단',
        detail: '본인이 기안한 판매장려금 건을 직접 승인할 수 없음 (내부회계관리 규정 4조)',
      },
      requiredRole: {
        badgeText: '충족 ✅ 상호 견제(Cross-Check) 준수',
        isSatisfied: true,
        title: '독립 부서 교차 검증',
        detail: '영업부와 분리된 제3의 재무/감사 부서가 독립적으로 적정성 검증',
      },
    },
    {
      id: 'row-department-function',
      label: '3. 소속 부서 및 기본 직무',
      isConflict: isSalesUser,
      conflictReason: '영업 성과 부서와 자금 통제 부서의 분리 필요',
      currentRole: {
        badgeText: '충돌 ❌ 영업 실적 부서',
        isSatisfied: false,
        title: `${currentUser.name} (${currentUser.department})`,
        detail: '화장품 B2B 총판 계약 체결 및 납품 실적 달성 추적',
      },
      requiredRole: {
        badgeText: '충족 ✅ 재무 자금 관리 부서',
        isSatisfied: true,
        title: '이재무 과장 (Corevia 재무자금팀)',
        detail: '계약 요율 산식 검산, 수취계좌 실명 대조, 펌뱅킹 출금 승인',
      },
    },
    {
      id: 'row-risk-mitigation',
      label: '4. 자금 리스크 통제',
      isConflict: isSalesUser,
      conflictReason: '실적 왜곡 및 부당 리베이트 지급 위험 노출',
      currentRole: {
        badgeText: '충돌 ❌ 위험 통제 불가',
        isSatisfied: false,
        title: '이해상충 및 부당지급 리스크',
        detail: '단독 결재 시 실적 허위 기재나 과다 요율 적용에 대한 사전 방어선 부재',
      },
      requiredRole: {
        badgeText: '충족 ✅ 위험 사전 차단',
        isSatisfied: true,
        title: 'ERP 원장 및 계좌 실명 대조',
        detail: '세금계산서 발행원장 및 은행 펌뱅킹 실명 인증을 통한 부정 지급 원천 차단',
      },
    },
    {
      id: 'row-action-status',
      label: '5. 현재 작업 실행 가능성',
      isConflict: isSalesUser,
      conflictReason: '승인 버튼 클릭 시 트랜잭션 차단',
      currentRole: {
        badgeText: '충돌 ❌ 작업 실행 차단',
        isSatisfied: false,
        title: '승인 불가 (Blocked)',
        detail: '현재 역할로는 승인 상태로 전환할 수 없으며 시스템에 차단 로그 기록',
      },
      requiredRole: {
        badgeText: '충족 ✅ 즉시 승인 가능',
        isSatisfied: true,
        title: '승인 확정 가능 (Allowed)',
        detail: '재무 승인자로 전환 후 즉시 승인 처리 및 모의 펌뱅킹 지급 진행 가능',
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col">
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
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Legend Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-300 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>조건부 통제 상태 평가 기준:</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                  충돌 항목 (위반/차단)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  충족 항목 (적격/허용)
                </span>
              </div>
            </div>
          </div>

          {/* Comparative 2-Column Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/70 shadow-inner">
            <table className="w-full text-left text-xs">
              {/* Table Column Headers */}
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 bg-slate-900 text-slate-400 w-32 border-r border-slate-800">
                    평가 항목
                  </th>
                  <th className="py-3 px-3.5 bg-rose-950/30 text-rose-300 w-1/2 border-r border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <UserX className="w-4 h-4 text-rose-400" />
                        현재 사용자 역할 (Current User)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/25 text-rose-300 border border-rose-500/40">
                        {currentUser.role} (영업직군)
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3.5 bg-emerald-950/30 text-emerald-300 w-1/2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        필수 승인자 역할 (Required Approver)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                        FINANCE / AUDIT (승인직군)
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body Rows with Conditional Styling */}
              <tbody className="divide-y divide-slate-800/70">
                {comparisonRows.map((row) => {
                  return (
                    <tr 
                      key={row.id}
                      className="hover:bg-slate-900/40 transition"
                    >
                      {/* Row Label */}
                      <td className="py-3 px-3.5 font-bold text-slate-300 bg-slate-900/40 border-r border-slate-800 align-top">
                        <div>{row.label}</div>
                        {row.isConflict && (
                          <div className="text-[10px] text-rose-400 font-normal mt-0.5">
                            ※ 통제 충돌
                          </div>
                        )}
                      </td>

                      {/* Current User Cell (Conflict -> Red Styling) */}
                      <td className="py-3 px-3.5 border-r border-slate-800 bg-rose-950/10 align-top space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                            !row.currentRole.isSatisfied
                              ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50'
                              : 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50'
                          }`}>
                            {!row.currentRole.isSatisfied ? (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span>{row.currentRole.badgeText}</span>
                          </span>
                        </div>
                        <div className="font-bold text-slate-100 text-xs">
                          {row.currentRole.title}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {row.currentRole.detail}
                        </p>
                      </td>

                      {/* Required Approver Cell (Satisfied -> Green Styling) */}
                      <td className="py-3 px-3.5 bg-emerald-950/10 align-top space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                            row.requiredRole.isSatisfied
                              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50'
                              : 'bg-rose-500/25 text-rose-200 border border-rose-500/50'
                          }`}>
                            {row.requiredRole.isSatisfied ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span>{row.requiredRole.badgeText}</span>
                          </span>
                        </div>
                        <div className="font-bold text-emerald-300 text-xs">
                          {row.requiredRole.title}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {row.requiredRole.detail}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Resolution Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span>원클릭 승인자 전환 (SoD 요구 조건 즉시 충족)</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    녹색 충족 상태로 전환
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  버튼을 클릭하면 자금 집행 전결권을 보유한 <strong>[이재무 과장]</strong> 역할로 즉시 변경되어 승인을 확정할 수 있습니다.
                </div>
              </div>
            </div>

            <button
              onClick={handleInstantSwitch}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-950 shrink-0 hover:scale-[1.02]"
            >
              <span>💼 이재무 과장으로 전환</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-[11px]">
            ※ 본 SoD 통제 차단 내역은 감사 대장(Audit Trail)에 영구 기록되어 사후 감사에 활용됩니다.
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
