import React, { useState } from 'react';
import { 
  X, 
  SendHorizontal, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  AlertTriangle,
  Receipt,
  ArrowRight
} from 'lucide-react';
import { RebateReview, UserProfile } from '../types';

interface SimulatePaymentModalProps {
  review: RebateReview | null;
  currentUser: UserProfile;
  onClose: () => void;
  onExecutePayment: (reviewId: string, transactionId: string) => void;
}

export const SimulatePaymentModal: React.FC<SimulatePaymentModalProps> = ({
  review,
  currentUser,
  onClose,
  onExecutePayment,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  if (!review) return null;

  const handleExecute = () => {
    setIsProcessing(true);
    // Simulate real firm-banking network roundtrip
    setTimeout(() => {
      const generatedTxn = `TXN-COR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setTransactionId(generatedTxn);
      setIsProcessing(false);
      setPaymentCompleted(true);
      onExecutePayment(review.id, generatedTxn);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <SendHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Corevia Cosmetics 펌뱅킹 모의 지급 실행
              </h2>
              <p className="text-xs text-slate-400">
                W07 판매장려금 재무 승인 완료 건에 대한 실제 계좌 이체 모의 시뮬레이션
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!paymentCompleted ? (
          <>
            {/* Payment Summary Voucher Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">심사 번호</span>
                <span className="font-mono text-rose-300 font-bold">{review.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">지급 대상 거래처</span>
                <span className="font-bold text-white text-sm">{review.vendorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">지급 화장품 제품군</span>
                <span className="text-slate-300">{review.productLine}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">수취 금융기관 / 계좌</span>
                <span className="font-mono text-slate-200">신한은행 110-***-882190</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">수취 예금주 확인</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  실명 일치 확인 완료
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-slate-300">최종 송금 집행액</span>
                <span className="font-black text-rose-400 text-lg">
                  ₩{review.calculatedRebateAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* Treasury & SoD Check Box */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>자금 집행자 확인: {currentUser.name} ({currentUser.department})</span>
              </div>
              <p className="text-[11px] text-slate-400">
                본 모의 지급을 실행하면 심사 상태가 <strong className="text-blue-300">[지급 완료]</strong>로 변경되며 
                대시보드의 진행 심사 건수가 즉시 갱신되고 감사로그에 전신환 영수증 번호가 영구 보존됩니다.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleExecute}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-950 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>펌뱅킹 이체 송신 중...</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>모의 펌뱅킹 이체 실행</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Payment Completed Voucher */
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">모의 펌뱅킹 이체 완료!</h3>
              <p className="text-xs text-slate-300 mt-1">
                판매장려금 <span className="font-bold text-rose-300">₩{review.calculatedRebateAmount.toLocaleString()}원</span>의 전신환 송금이 성공적으로 완료되었습니다.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">거래 고유 번호:</span>
                <span className="text-emerald-400 font-bold">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">수취 계좌:</span>
                <span className="text-slate-200">신한은행 110-***-882190</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">출금 계좌:</span>
                <span className="text-slate-200">Corevia B2B 정기지급계좌 (우리 1005-***)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">집행 일시:</span>
                <span className="text-slate-200">{new Date().toISOString().replace('T', ' ').substring(0, 19)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              확인 및 닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
