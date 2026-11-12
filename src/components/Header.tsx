import React from 'react';
import { 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  UserCircle2, 
  RotateCcw, 
  Calculator, 
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Award
} from 'lucide-react';
import { UserProfile, CorporateEntity } from '../types';
import { USER_PROFILES, CORPORATE_ENTITIES } from '../data/initialData';
import { AiEngineStatus } from '../services/aiService';

interface HeaderProps {
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  aiStatus: AiEngineStatus;
  onResetSeedData: () => void;
  onOpenCostCalculator: () => void;
  onOpenGuide: () => void;
  onOpenChat?: () => void;
  activeReviewsCount: number;
  openTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  aiStatus,
  onResetSeedData,
  onOpenCostCalculator,
  onOpenGuide,
  onOpenChat,
  activeReviewsCount,
  openTasksCount,
}) => {

  const coreviaEntity = CORPORATE_ENTITIES.find(e => e.id === 'corevia-cosmetics');

  return (
    <header className="sticky top-0 z-40 bg-[#080d16] border-b border-stone-800 text-stone-100 shadow-2xl backdrop-blur-md bg-opacity-95">
      {/* Top corporate entity context & docket tracking bar */}
      <div className="bg-[#05080f] px-4 py-1.5 border-b border-stone-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-cinzel text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 tracking-wider">
            <Scale className="w-3 h-3 text-amber-400" />
            AURORA GROUP DOCKET
          </span>
          <span className="text-stone-500 font-mono text-[11px]">W07-COR-2026</span>
          <span className="text-stone-700">|</span>
          <span className="font-medium text-stone-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {coreviaEntity?.name} (화장품 제조사)
          </span>
          <span className="text-stone-500 hidden md:inline text-[11px]">· Samil PwC W07 판매장려금 통제 관할</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-stone-300 text-xs">
            <span className="text-stone-400">진행 심사:</span>
            <span className="font-editorial text-sm text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30">
              {activeReviewsCount}건
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-300 text-xs">
            <span className="text-stone-400">후속 소명·일정:</span>
            <span className="font-editorial text-sm text-indigo-300 font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/30">
              {openTasksCount}건
            </span>
          </div>
          <span className="text-stone-700">|</span>
          <button
            onClick={onResetSeedData}
            title="초기 5건 심사 / 4건 후속작업 목업 데이터로 재설정합니다."
            className="inline-flex items-center gap-1 text-stone-400 hover:text-amber-200 transition-colors cursor-pointer text-xs py-0.5 px-2 rounded hover:bg-stone-900"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>시연 데이터 재설정</span>
          </button>
        </div>
      </div>

      {/* Main branding & actions bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand info with Sincere Legal-inspired typography */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-stone-900 via-stone-800 to-[#121929] border border-amber-500/40 flex items-center justify-center shadow-lg text-amber-300 font-cinzel font-bold text-xl tracking-wider">
            N
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-cinzel font-bold tracking-wider text-stone-100 flex items-center gap-2">
                NEXORA
                <span className="font-editorial italic font-normal text-xs px-2.5 py-0.5 rounded bg-stone-900 text-amber-300/90 border border-amber-500/30">
                  Cosmetics Trade & Rebate Operations
                </span>
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 font-sans">
              가상 화장품 그룹 Aurora 산하 <strong className="text-stone-200 font-semibold">Corevia Cosmetics</strong> B2B 거래처 판매장려금 AI 검증 및 직무분리(SoD) 통제
            </p>
          </div>
        </div>

        {/* Action Controls & User Role Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* AI Status Pill */}
          <div 
            title={aiStatus.message}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800 text-xs shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-400 font-medium hidden sm:inline">AI 심사 엔진:</span>
            <span className="text-emerald-400 font-semibold">{aiStatus.model}</span>
            {aiStatus.isRealApiReady ? (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            ) : (
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="규칙 검산 엔진 활성"></span>
            )}
          </div>

          {/* AI Advisor Chat Tab Launcher */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 hover:from-amber-900/80 hover:to-stone-800 text-amber-300 border border-amber-500/50 transition text-xs font-semibold cursor-pointer shadow-md shadow-amber-950/30"
              title="W07 법무 및 판매장려금 AI 자문관과 실시간 질의응답을 시작합니다."
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>AI 자문관</span>
            </button>
          )}

          {/* AI Cost Calculator Button */}

          <button
            onClick={onOpenCostCalculator}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition text-xs font-medium cursor-pointer"
            title="OpenAI / Gemini API 요금 및 토큰 계산기"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI 비용 계산기</span>
          </button>

          {/* Guide Modal Button */}
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition text-xs font-medium cursor-pointer"
            title="화장품 제조 B2B 판매장려금 업무 흐름 둘러보기"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">업무 가이드</span>
          </button>

          {/* SoD User Role Selector with Sincere Executive styling */}
          <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
            <span className="text-xs text-stone-400 font-cinzel text-[11px] hidden lg:inline">SoD Role:</span>
            <div className="relative">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const target = USER_PROFILES.find(u => u.id === e.target.value);
                  if (target) onSwitchUser(target);
                }}
                className="bg-stone-900 text-stone-200 border border-stone-700 hover:border-amber-500/50 rounded-lg text-xs py-1.5 pl-2.5 pr-7 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer appearance-none font-medium"
              >
                {USER_PROFILES.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'SALES' ? '👔 ' : u.role === 'FINANCE' ? '💼 ' : '🛡️ '}
                    {u.name} ({u.role === 'SALES' ? '영업기안' : u.role === 'FINANCE' ? '재무승인' : '감사실'})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
