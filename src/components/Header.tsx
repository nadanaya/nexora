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
  AlertTriangle
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
  activeReviewsCount,
  openTasksCount,
}) => {
  const coreviaEntity = CORPORATE_ENTITIES.find(e => e.id === 'corevia-cosmetics');

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl backdrop-blur-md bg-opacity-95">
      {/* Top corporate entity context bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-1.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Aurora Group
          </span>
          <span className="text-slate-400">화장품 그룹 지주사 산하</span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            {coreviaEntity?.name} (화장품 제조사)
          </span>
          <span className="text-slate-500 hidden md:inline">· Samil PwC W07 판매장려금 운영 과제</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">진행 심사:</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              {activeReviewsCount}건
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">열린 후속작업:</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
              {openTasksCount}건
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <button
            onClick={onResetSeedData}
            title="초기 5건 심사 / 4건 후속작업 목업 데이터로 재설정합니다."
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs py-0.5 px-2 rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span>시연 데이터 재설정 (Seed)</span>
          </button>
        </div>
      </div>

      {/* Main branding & actions bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand info */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/40 text-white font-black text-xl tracking-tight">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                NEXORA
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-rose-300 border border-rose-500/20 font-medium">
                  Cosmetics Trade & Rebate Operations
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              화장품 제조사 <span className="text-slate-200 font-medium">Corevia Cosmetics</span> 거래처 판매장려금 및 유통관계 AI 운영 시스템
            </p>
          </div>
        </div>

        {/* Action Controls & User Role Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* AI Status Pill */}
          <div 
            title={aiStatus.message}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-slate-300 font-medium hidden sm:inline">AI 심사:</span>
            <span className="text-emerald-400 font-semibold">{aiStatus.model}</span>
            {aiStatus.isRealApiReady ? (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            ) : (
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="규칙 검산 엔진 활성"></span>
            )}
          </div>

          {/* AI Cost Calculator Button */}
          <button
            onClick={onOpenCostCalculator}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-xs font-medium cursor-pointer"
            title="OpenAI / Gemini API 요금 및 토큰 계산기"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AI 비용 계산기</span>
          </button>

          {/* Guide Modal Button */}
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-xs font-medium cursor-pointer"
            title="화장품 제조 B2B 판매장려금 업무 흐름 둘러보기"
          >
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">업무 가이드</span>
          </button>

          {/* SoD User Role Selector */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
            <span className="text-xs text-slate-400 hidden lg:inline">직무 분리(SoD):</span>
            <div className="relative">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const target = USER_PROFILES.find(u => u.id === e.target.value);
                  if (target) onSwitchUser(target);
                }}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs py-1.5 pl-2.5 pr-7 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer appearance-none font-medium"
              >
                {USER_PROFILES.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'SALES' ? '👔 ' : u.role === 'FINANCE' ? '💼 ' : '🛡️ '}
                    {u.name} ({u.role === 'SALES' ? '영업' : u.role === 'FINANCE' ? '재무' : '감사'})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
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
