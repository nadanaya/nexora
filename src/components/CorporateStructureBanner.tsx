import React, { useState } from 'react';
import { 
  Building2, 
  FlaskConical, 
  ShoppingBag, 
  Dna, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  BadgeCheck, 
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { CORPORATE_ENTITIES } from '../data/initialData';

interface CorporateStructureBannerProps {
  onSelectEntityTab?: (entityId: string) => void;
}

export const CorporateStructureBanner: React.FC<CorporateStructureBannerProps> = ({
  onSelectEntityTab,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent pointer-events-none rounded-tr-2xl" />

      {/* Header section with toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                가상 화장품 그룹 Aurora · Corevia Cosmetics W07 과제 배경
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Samil PwC 과제 도메인 완벽 적용
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              화장품 제조사 <span className="font-semibold text-rose-300">Corevia Cosmetics</span>의 거래처별 판매장려금과 유통 관계를 통합 분석하여, 
              관련 거래처에 대한 지급 적정성을 검증하고 <span className="text-emerald-300 font-medium">영업</span>·
              <span className="text-indigo-300 font-medium">재무</span>·
              <span className="text-amber-300 font-medium">내부 감시</span> 부서의 의사결정과 지급 실행을 연결하는 AI 운영 시스템입니다.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 self-start md:self-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer shrink-0"
        >
          <span>{isExpanded ? '구조 요약 접기' : '그룹 구조 및 부서 흐름 보기'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Corporate Entities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Aurora Holdings */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  지주사 (Holding)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  전략·투자·재무
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Aurora Holdings</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                화장품 그룹 지주사로서 전략, M&A 투자, 자본 배분 및 그룹 내부통제 감사 총괄
              </p>
            </div>

            {/* Corevia Cosmetics (W07 Subject) */}
            <div className="p-3.5 rounded-xl bg-rose-950/20 border-2 border-rose-500/50 shadow-md shadow-rose-950/30 relative">
              <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold tracking-wide uppercase">
                W07 주관 과제
              </div>
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  화장품 제조 (Manufacturing)
                </span>
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Corevia Cosmetics
                <BadgeCheck className="w-4 h-4 text-rose-400" />
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                스킨케어·더마 화장품 제조 OEM/ODM 및 B2B 총판 대상 분기 판매장려금(Rebate) 심사·지급
              </p>
            </div>

            {/* Masil Commerce */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  화장품 유통 (Distribution)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  캠페인·판매·재고
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Masil Commerce</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                올리브영/드럭스토어/면세점/자사몰 유통 채널 및 풀필먼트·배송 전담 자회사
              </p>
            </div>

            {/* Celtonic Labs */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5" />
                  바이오 원료 (M&A 심사 중)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  인수 추진
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Celtonic Labs</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                엑소좀·EGF 고기능 화장품 원료 R&D 기업으로 오로라 그룹 지분 인수 실사 진행 중
              </p>
            </div>
          </div>

          {/* Department Connection Flow */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold shrink-0">
              <Layers className="w-4 h-4 text-rose-400" />
              <span>부서별 실무 연결 흐름:</span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-200">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  영업부 (Sales)
                </div>
                <div className="text-[11px] text-slate-300">
                  거래처 Q3 판매 실적 원장 집계, 판매장려금 기안, 한도 초과 시 영업 소명서 작성
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-indigo-200">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  재무부 (Finance)
                </div>
                <div className="text-[11px] text-slate-300">
                  계약 요율 산식 검산, 수취계좌 예금주 실명 증빙 확인, 펌뱅킹 지급 실행 및 일정 관리
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-200">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  내부 감시 (Audit & SoD)
                </div>
                <div className="text-[11px] text-slate-300">
                  마실커머스/Celtonic 특수관계인 탐지, 기안자-승인자 직무분리(SoD) 통제, 감사로그 불변 기록
                </div>
              </div>
            </div>
          </div>

          {/* Principle Clarification Notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-400 text-[11px]">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-slate-300">W07 원본 정합성 준수:</strong> W07에 없는 화장품 원료·배치·품질 검사 데이터를 인위적으로 심사 필수값에 추가하지 않고, 
              화장품 제조·유통 B2B 산업 맥락을 명확히 하되 원본 판매 실적, 거래처 관계, 월 한도, 계좌 증빙 기준 규칙을 엄정히 유지합니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
