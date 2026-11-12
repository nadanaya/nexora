/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FlaskConical, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  ClipboardList,
  Clock,
  Network,
  History,
  X
} from 'lucide-react';
import { 
  RebateReview, 
  FollowUpTask, 
  AuditLog, 
  UserProfile, 
  ReviewStatus 
} from './types';
import { 
  INITIAL_REVIEWS, 
  INITIAL_TASKS, 
  INITIAL_AUDIT_LOGS, 
  USER_PROFILES 
} from './data/initialData';
import { 
  checkAiEngineStatus, 
  runRebateAiAnalysis, 
  AiEngineStatus 
} from './services/aiService';

import { Header } from './components/Header';
import { CorporateStructureBanner } from './components/CorporateStructureBanner';
import { DashboardStats } from './components/DashboardStats';
import { ReviewsList } from './components/ReviewsList';
import { ReviewDetailModal } from './components/ReviewDetailModal';
import { FollowUpTasksList } from './components/FollowUpTasksList';
import { RelationshipGraph } from './components/RelationshipGraph';
import { SimulatePaymentModal } from './components/SimulatePaymentModal';
import { AiCostCalculatorModal } from './components/AiCostCalculatorModal';
import { AppGuideModal } from './components/AppGuideModal';
import { AuditLogView } from './components/AuditLogView';

export default function App() {
  // Current user (defaults to Finance Manager 이재무 for direct review/approval demonstration)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return USER_PROFILES.find((u) => u.role === 'FINANCE') || USER_PROFILES[0];
  });

  // State with LocalStorage persistence
  const [reviews, setReviews] = useState<RebateReview[]>(() => {
    const saved = localStorage.getItem('nexora_w07_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_REVIEWS;
  });

  const [tasks, setTasks] = useState<FollowUpTask[]>(() => {
    const saved = localStorage.getItem('nexora_w07_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_TASKS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('nexora_w07_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('nexora_w07_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('nexora_w07_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('nexora_w07_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // AI Status
  const [aiStatus, setAiStatus] = useState<AiEngineStatus>({
    isServerConnected: false,
    provider: 'Google Gemini AI',
    model: 'gemini-3.8-flash',
    isRealApiReady: true,
    message: 'Gemini 3.8 Flash W07 심사 엔진 연결됨',
  });

  useEffect(() => {
    checkAiEngineStatus().then((st) => setAiStatus(st));
  }, []);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'reviews' | 'tasks' | 'network' | 'audit'>('reviews');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('ACTIVE');

  // Modals state
  const [selectedReviewForModal, setSelectedReviewForModal] = useState<RebateReview | null>(null);
  const [paymentReviewForModal, setPaymentReviewForModal] = useState<RebateReview | null>(null);
  const [isCostCalculatorOpen, setIsCostCalculatorOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [sodAlertMessage, setSodAlertMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnalyzingId, setIsAnalyzingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Helper to add audit log
  const logAudit = (action: string, reviewCode?: string, vendorName?: string, details?: string, prev?: string, next?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      reviewCode,
      vendorName,
      details: details || `${action} 실행됨`,
      prevStatus: prev,
      nextStatus: next,
    };
    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);
  };

  // 1. Reset / Seed Idempotent Function
  const handleResetSeedData = () => {
    setReviews(INITIAL_REVIEWS);
    setTasks(INITIAL_TASKS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem('nexora_w07_reviews');
    localStorage.removeItem('nexora_w07_tasks');
    localStorage.removeItem('nexora_w07_audit_logs');
    showToast('W07 시연 데이터가 초기 상태(진행 심사 5건, 열린 후속 작업 4건)로 재설정되었습니다.');
  };

  // 2. Approve Review
  const handleApproveReview = (reviewId: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;

    const prevStatus = target.status;
    const nextStatus: ReviewStatus = 'APPROVED';

    const updatedApprovalHistory = [
      ...target.approvalHistory,
      {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: '재무 지급 승인 확정',
        note: `계약 산식 및 한도 검증 완료. 펌뱅킹 지급 집행 승인.`,
      },
    ];

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              status: nextStatus,
              approvalHistory: updatedApprovalHistory,
            }
          : r
      )
    );

    logAudit('판매장려금 지급 승인', target.code, target.vendorName, `재무담당자 ${currentUser.name} 승인 완료. 모의 지급 대기 상태로 전환.`, prevStatus, nextStatus);
    showToast(`[${target.code}] ${target.vendorName} 판매장려금이 승인되었습니다. 진행 심사 건수가 갱신되었습니다.`);
  };

  // 3. Reject Review
  const handleRejectReview = (reviewId: string, reason: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;

    const prevStatus = target.status;
    const nextStatus: ReviewStatus = 'REJECTED';

    const updatedApprovalHistory = [
      ...target.approvalHistory,
      {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: '심사 반려 / 거절',
        note: reason,
      },
    ];

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              status: nextStatus,
              rejectionReason: reason,
              approvalHistory: updatedApprovalHistory,
            }
          : r
      )
    );

    logAudit('판매장려금 심사 반려', target.code, target.vendorName, `사유: ${reason}`, prevStatus, nextStatus);
    showToast(`[${target.code}] 심사가 반려되었습니다.`);
  };

  // 4. Hold Review
  const handleHoldReview = (reviewId: string, reason: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;

    const prevStatus = target.status;
    const nextStatus: ReviewStatus = 'ON_HOLD';

    const updatedApprovalHistory = [
      ...target.approvalHistory,
      {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: '지급 보류 조치',
        note: reason,
      },
    ];

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              status: nextStatus,
              approvalHistory: updatedApprovalHistory,
            }
          : r
      )
    );

    logAudit('판매장려금 보류 설정', target.code, target.vendorName, `보류 사유: ${reason}`, prevStatus, nextStatus);
    showToast(`[${target.code}] 건이 보류 처리되었습니다.`);
  };

  // 5. Re-examination
  const handleRequestReExamination = (reviewId: string, note: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;

    const prevStatus = target.status;
    const nextStatus: ReviewStatus = 'RE_EXAMINATION';

    const updatedApprovalHistory = [
      ...target.approvalHistory,
      {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: '재심사 요청',
        note,
      },
    ];

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              status: nextStatus,
              approvalHistory: updatedApprovalHistory,
            }
          : r
      )
    );

    logAudit('재심사 요청 상정', target.code, target.vendorName, `재심사 사유: ${note}`, prevStatus, nextStatus);
    showToast(`[${target.code}] 재심사가 요청되었습니다.`);
  };

  // 6. Simulate Wire Payment
  const handleExecutePayment = (reviewId: string, transactionId: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;

    const prevStatus = target.status;
    const nextStatus: ReviewStatus = 'PAID';

    const updatedApprovalHistory = [
      ...target.approvalHistory,
      {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: '모의 펌뱅킹 이체 완료',
        note: `신한은행 펌뱅킹 이체 성공 (전신환 번호: ${transactionId})`,
      },
    ];

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              status: nextStatus,
              paymentTransactionId: transactionId,
              paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              approvalHistory: updatedApprovalHistory,
            }
          : r
      )
    );

    logAudit(
      '펌뱅킹 모의 지급 완료',
      target.code,
      target.vendorName,
      `지급액 ₩${target.calculatedRebateAmount.toLocaleString()}원 송금 완료 (거래번호: ${transactionId})`,
      prevStatus,
      nextStatus
    );
    showToast(`[${target.code}] 모의 펌뱅킹 이체가 완료되었습니다.`);
  };

  // 7. Resolve Follow-up Task
  const handleResolveTask = (taskId: string, submissionNote?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const resolvedTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'RESOLVED',
              submissionNote,
              resolvedAt: resolvedTime,
            }
          : t
      )
    );

    // If it was linked to a review, update that review too!
    if (task.reviewId) {
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === task.reviewId) {
            return {
              ...r,
              hasSalesExplanation: true,
              salesExplanationNote: submissionNote || r.salesExplanationNote,
              accountVerified: task.type === 'BANK_DOC_VERIFICATION' ? true : r.accountVerified,
            };
          }
          return r;
        })
      );
    }

    logAudit('후속 작업 처리 완료', task.reviewCode, task.vendorName, `작업: ${task.title} (소명/결과: ${submissionNote || '완료'})`);
    showToast(`후속 작업이 완료되었습니다. 열린 후속 작업 건수가 갱신되었습니다.`);
  };

  // 8. Run AI Analysis
  const handleRunAiAnalysis = async (reviewId: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;

    setIsAnalyzingId(reviewId);
    try {
      const result = await runRebateAiAnalysis(target);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                aiAnalysis: result,
              }
            : r
        )
      );

      // If the detail modal is viewing this, update it too
      if (selectedReviewForModal && selectedReviewForModal.id === reviewId) {
        setSelectedReviewForModal((prev) => (prev ? { ...prev, aiAnalysis: result } : null));
      }

      logAudit('Gemini AI 위험도 검증 완료', target.code, target.vendorName, `AI 판정: 위험도 ${result.riskLevel} (${result.riskScore}점), 조치 권고: ${result.recommendedAction}`);
      showToast(`[${target.code}] AI 위험도 및 거래처 관계 분석이 완료되었습니다.`);
    } catch (e) {
      console.error(e);
      showToast('AI 분석 도중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzingId(null);
    }
  };

  // Compute live active numbers for header and dashboard
  const activeReviewsCount = reviews.filter(
    (r) => r.status === 'PENDING_APPROVAL' || r.status === 'DOC_VERIFICATION' || r.status === 'RE_EXAMINATION' || r.status === 'ON_HOLD'
  ).length;

  const openTasksCount = tasks.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={setCurrentUser}
        aiStatus={aiStatus}
        onResetSeedData={handleResetSeedData}
        onOpenCostCalculator={() => setIsCostCalculatorOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        activeReviewsCount={activeReviewsCount}
        openTasksCount={openTasksCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Corporate Background Banner */}
        <CorporateStructureBanner />

        {/* Clickable 4-KPI Dashboard Stats */}
        <DashboardStats
          reviews={reviews}
          tasks={tasks}
          onSelectTab={setActiveTab}
          onSetReviewStatusFilter={setReviewStatusFilter}
        />

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>판매장려금 심사 목록</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              진행 {activeReviewsCount}건
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>열린 후속 작업</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-300'
            }`}>
              대기 {openTasksCount}건
            </span>
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'network'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>거래처 관계망 & 지분 탐지</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'audit'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>불변 감사 로그 ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'reviews' && (
          <ReviewsList
            reviews={reviews}
            currentUser={currentUser}
            onOpenDetailModal={(r) => setSelectedReviewForModal(r)}
            onApproveReview={handleApproveReview}
            onRejectReview={handleRejectReview}
            onOpenSimulatePayment={(r) => setPaymentReviewForModal(r)}
            onRunAiAnalysis={handleRunAiAnalysis}
            isAnalyzingId={isAnalyzingId}
            statusFilter={reviewStatusFilter}
            onStatusFilterChange={setReviewStatusFilter}
            onShowSoDAlert={(msg) => setSodAlertMessage(msg)}
          />
        )}

        {activeTab === 'tasks' && (
          <FollowUpTasksList
            tasks={tasks}
            currentUser={currentUser}
            onResolveTask={handleResolveTask}
            onOpenReviewDetailByCode={(code) => {
              const found = reviews.find((r) => r.code === code);
              if (found) {
                setSelectedReviewForModal(found);
              }
            }}
          />
        )}

        {activeTab === 'network' && (
          <RelationshipGraph
            onSelectVendorReview={(vendorName) => {
              setActiveTab('reviews');
              setReviewStatusFilter('ALL');
            }}
          />
        )}

        {activeTab === 'audit' && <AuditLogView logs={auditLogs} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">NEXORA</span>
            <span>· Cosmetics Trade & Rebate Operations</span>
            <span>(가상 화장품 그룹 Aurora · Corevia Cosmetics W07 과제)</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Samil PwC 화장품 제조사 판매장려금 및 유통 관계 분석 AI 운영 시스템
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      {selectedReviewForModal && (
        <ReviewDetailModal
          review={selectedReviewForModal}
          currentUser={currentUser}
          onClose={() => setSelectedReviewForModal(null)}
          onApprove={handleApproveReview}
          onReject={handleRejectReview}
          onHold={handleHoldReview}
          onRequestReExamination={handleRequestReExamination}
          onOpenSimulatePayment={(r) => setPaymentReviewForModal(r)}
          onRunAiAnalysis={handleRunAiAnalysis}
          isAnalyzing={isAnalyzingId === selectedReviewForModal.id}
          onShowSoDAlert={(msg) => setSodAlertMessage(msg)}
        />
      )}

      {/* Simulate Payment Modal */}
      {paymentReviewForModal && (
        <SimulatePaymentModal
          review={paymentReviewForModal}
          currentUser={currentUser}
          onClose={() => setPaymentReviewForModal(null)}
          onExecutePayment={handleExecutePayment}
        />
      )}

      {/* Cost Calculator Modal */}
      {isCostCalculatorOpen && (
        <AiCostCalculatorModal onClose={() => setIsCostCalculatorOpen(false)} />
      )}

      {/* App Guide Modal */}
      {isGuideOpen && <AppGuideModal onClose={() => setIsGuideOpen(false)} />}

      {/* SoD Protection Alert Modal */}
      {sodAlertMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400 font-bold text-base">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span>직무 분리(SoD) 통제 경고</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {sodAlertMessage}
            </p>
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400">
                현재 역할: <strong className="text-white">{currentUser.name} ({currentUser.role})</strong>
              </div>
              <button
                onClick={() => setSodAlertMessage(null)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
