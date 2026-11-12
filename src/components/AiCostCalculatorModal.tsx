import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  Sparkles, 
  ShieldCheck, 
  TrendingDown, 
  DollarSign, 
  Info,
  CheckCircle2,
  ExternalLink,
  Scale
} from 'lucide-react';

interface AiCostCalculatorModalProps {
  onClose: () => void;
}

export const AiCostCalculatorModal: React.FC<AiCostCalculatorModalProps> = ({ onClose }) => {
  const [reviewCount, setReviewCount] = useState<number>(100);
  const [inputTokens, setInputTokens] = useState<number>(2000);
  const [outputTokens, setOutputTokens] = useState<number>(500);

  // Pricing per 1M tokens (USD)
  // GPT-5.4 mini: Input $0.75 / Output $4.50
  const gptMiniCost = 
    ((inputTokens * reviewCount) / 1000000) * 0.75 +
    ((outputTokens * reviewCount) / 1000000) * 4.50;

  // GPT-5.4 nano: Input $0.20 / Output $1.25
  const gptNanoCost = 
    ((inputTokens * reviewCount) / 1000000) * 0.20 +
    ((outputTokens * reviewCount) / 1000000) * 1.25;

  // Gemini 3.8 Flash: Input $0.075 / Output $0.30 (Google AI Studio provides generous free tier)
  const geminiFlashCost = 
    ((inputTokens * reviewCount) / 1000000) * 0.075 +
    ((outputTokens * reviewCount) / 1000000) * 0.30;

  const wonRate = 1430;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#090e18] border border-stone-800 rounded-3xl max-w-2xl w-full my-auto p-6 shadow-2xl space-y-5">
        {/* Header with Sincere Legal-inspired typography */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="font-cinzel text-xs font-bold text-amber-400 tracking-wider">
                COMPLIANCE COST & TOKEN ESTIMATOR
              </div>
              <h2 className="text-lg font-editorial font-bold text-stone-100 tracking-tight mt-0.5 flex items-center gap-2">
                NEXORA AI 심사 API 비용 및 토큰 계산기
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans font-semibold">
                  Samil PwC W07 시연 전용
                </span>
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                화장품 거래처 판매장려금 심사 1회당 약 2,500토큰 기준 예상 API 청구 비용 시뮬레이션
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders */}
        <div className="p-4 rounded-2xl bg-[#05080f] border border-stone-800 space-y-4 text-xs font-sans">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-stone-300">월간 AI 심사 요청 횟수:</span>
              <span className="font-editorial font-bold text-amber-300 text-base">{reviewCount.toLocaleString()}회</span>
            </div>
            <input
              type="range"
              min="5"
              max="2000"
              step="5"
              value={reviewCount}
              onChange={(e) => setReviewCount(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500 mt-1 font-mono">
              <span>시연 5회 (최소)</span>
              <span>100회 (권장 테스트)</span>
              <span>1,000회 (기업 운영)</span>
              <span>2,000회</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-stone-800">
            <div>
              <div className="flex justify-between text-stone-400 text-[11px] mb-1 font-sans">
                <span>1회당 입력 토큰:</span>
                <span className="text-stone-100 font-mono">{inputTokens} tokens</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={inputTokens}
                onChange={(e) => setInputTokens(Number(e.target.value))}
                className="w-full accent-stone-400 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-stone-400 text-[11px] mb-1 font-sans">
                <span>1회당 출력 토큰:</span>
                <span className="text-stone-100 font-mono">{outputTokens} tokens</span>
              </div>
              <input
                type="range"
                min="200"
                max="2000"
                step="100"
                value={outputTokens}
                onChange={(e) => setOutputTokens(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Cost Comparison Table */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Gemini 3.8 Flash */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/50 shadow-md">
            <div className="flex items-center justify-between text-xs font-cinzel font-bold text-emerald-400 mb-1">
              <span>GEMINI 3.8 FLASH</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans">
                기본 엔진
              </span>
            </div>
            <div className="text-2xl font-editorial font-bold text-stone-100 mt-2">
              ${geminiFlashCost.toFixed(3)}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5 font-sans">
              약 {Math.round(geminiFlashCost * wonRate).toLocaleString()}원 (KRW)
            </div>
            <p className="text-[10px] text-stone-400 mt-2 font-sans">
              Google AI Studio 무료 티어 및 최저가 고속 심사 모델
            </p>
          </div>

          {/* GPT-5.4 mini */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <div className="flex items-center justify-between text-xs font-cinzel font-bold text-amber-400 mb-1">
              <span>GPT-5.4 MINI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-sans">
                OpenAI 추천
              </span>
            </div>
            <div className="text-2xl font-editorial font-bold text-stone-100 mt-2">
              ${gptMiniCost.toFixed(3)}
            </div>
            <div className="text-[11px] text-amber-300 font-semibold mt-0.5 font-sans">
              약 {Math.round(gptMiniCost * wonRate).toLocaleString()}원 (KRW)
            </div>
            <p className="text-[10px] text-stone-400 mt-2 font-sans">
              100회 분석 시 약 $0.38로 커피 한 잔보다 훨씬 저렴
            </p>
          </div>

          {/* GPT-5.4 nano */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <div className="flex items-center justify-between text-xs font-cinzel font-bold text-stone-300 mb-1">
              <span>GPT-5.4 NANO</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-sans">
                초경량
              </span>
            </div>
            <div className="text-2xl font-editorial font-bold text-stone-100 mt-2">
              ${gptNanoCost.toFixed(3)}
            </div>
            <div className="text-[11px] text-stone-300 font-semibold mt-0.5 font-sans">
              약 {Math.round(gptNanoCost * wonRate).toLocaleString()}원 (KRW)
            </div>
            <p className="text-[10px] text-stone-400 mt-2 font-sans">
              단일 룰 체크에 적합한 초저비용 보조 모델
            </p>
          </div>
        </div>

        {/* 4 Budget Safety Guidelines */}
        <div className="p-4 rounded-2xl bg-[#05080f] border border-stone-800 text-xs space-y-2 font-sans">
          <h4 className="font-editorial text-sm font-bold text-stone-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            안전한 API 비용 관리를 위한 4가지 수칙
          </h4>
          <ul className="space-y-1.5 text-stone-300 text-[11px]">
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">1.</span>
              <span><strong>월 $5 예산 한도 알림 설정:</strong> OpenAI/GCP 플랫폼에서 월 $5 초과 시 알림을 등록하면 과도한 청구를 100% 예방합니다.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">2.</span>
              <span><strong>서버 측 환경변수만 사용:</strong> API 키는 절대 프론트엔드 코드나 브라우저에 노출하지 않고 서버(Express/FastAPI)에서만 관리합니다.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">3.</span>
              <span><strong>동일 거래처 분석 캐싱:</strong> 동일 분기 매출액 변경이 없는 거래처는 이전 AI 분석 결과를 재사용합니다.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">4.</span>
              <span><strong>규칙 검산 엔진 병행:</strong> API 미연결 시에도 내장된 W07 수식 검산 규칙으로 100% 무료 심사가 가능합니다.</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold transition cursor-pointer font-cinzel tracking-wider"
        >
          계산기 닫기
        </button>
      </div>
    </div>
  );
};
