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
  Scale,
  ScrollText,
  FileSignature
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
    <div className="bg-[#090e18] rounded-2xl border border-stone-800 p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Decorative subtle hairline grid accent */}
      <div className="absolute top-0 right-0 w-80 h-36 bg-gradient-to-bl from-amber-500/5 via-stone-800/10 to-transparent pointer-events-none rounded-tr-2xl" />

      {/* Header section with toggle and legal docket framing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-800">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-cinzel text-xs font-bold text-amber-400 tracking-wider">
                § 1. CORPORATE GOVERNANCE CHARTER
              </span>
              <span className="text-stone-600">|</span>
              <h2 className="text-base sm:text-lg font-editorial font-bold text-stone-100 tracking-tight">
                가상 화장품 그룹 Aurora · Corevia Cosmetics W07 과제 관할
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Samil PwC 과제 도메인 완벽 적용
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed max-w-4xl font-sans">
              화장품 제조사 <strong className="text-rose-300 font-semibold">Corevia Cosmetics</strong>의 거래처별 판매장려금과 유통 관계를 통합 분석하여, 
              관련 거래처에 대한 지급 적정성을 검증하고 <span className="text-emerald-300 font-medium">영업</span>·
              <span className="text-indigo-300 font-medium">재무</span>·
              <span className="text-amber-300 font-medium">내부 감시</span> 부서의 의사결정과 지급 실행을 연결하는 AI 운영 시스템입니다.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 self-start md:self-center px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-medium border border-stone-800 transition cursor-pointer shrink-0"
        >
          <span>{isExpanded ? '구조 요약 접기' : '그룹 구조 및 부서 흐름 보기'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-4">
          {/* Corporate Entities Grid - Structured Executive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Aurora Holdings */}
            <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800/90 hover:border-amber-500/40 transition group">
              <div className="flex items-center justify-between text-xs text-amber-400 font-cinzel font-semibold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  HOLDING ENTITY
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans">
                  지주사
                </span>
              </div>
              <h3 className="text-base font-editorial font-bold text-stone-100 group-hover:text-amber-200 transition">
                Aurora Holdings
              </h3>
              <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                그룹 거버넌스 총괄, M&A 투자, 자본 배분 및 그룹 내부통제 감사위원회 운영
              </p>
            </div>

            {/* Corevia Cosmetics (W07 Subject) */}
            <div className="p-4 rounded-xl bg-[#0d0912] border-2 border-rose-500/60 shadow-lg shadow-rose-950/20 relative group">
              <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-cinzel font-bold tracking-wider uppercase">
                W07 SUBJECT ENTITY
              </div>
              <div className="flex items-center justify-between text-xs text-rose-300 font-cinzel font-semibold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  MANUFACTURING
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30 font-sans">
                  화장품 제조
                </span>
              </div>
              <h3 className="text-base font-editorial font-bold text-stone-100 flex items-center gap-1.5">
                Corevia Cosmetics
                <BadgeCheck className="w-4 h-4 text-rose-400" />
              </h3>
              <p className="text-xs text-stone-300 mt-1.5 line-clamp-2 leading-relaxed">
                스킨케어·더마 화장품 제조 OEM/ODM 및 B2B 총판 대상 판매장려금(Rebate) 심사·지급 주관
              </p>
            </div>

            {/* Masil Commerce */}
            <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800/90 hover:border-indigo-500/40 transition group">
              <div className="flex items-center justify-between text-xs text-indigo-400 font-cinzel font-semibold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  DISTRIBUTION
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-sans">
                  유통 자회사
                </span>
              </div>
              <h3 className="text-base font-editorial font-bold text-stone-100 group-hover:text-indigo-200 transition">
                Masil Commerce
              </h3>
              <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                올리브영·드럭스토어·면세점·온라인몰 유통 채널 및 풀필먼트·물류 배송 전담
              </p>
            </div>

            {/* Celtonic Labs */}
            <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800/90 hover:border-emerald-500/40 transition group">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-cinzel font-semibold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5" />
                  BIO INGREDIENTS
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans">
                  M&A 실사
                </span>
              </div>
              <h3 className="text-base font-editorial font-bold text-stone-100 group-hover:text-emerald-200 transition">
                Celtonic Labs
              </h3>
              <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                고기능성 엑소좀·EGF 펩타이드 R&D 바이오 기업 (지주사 지분 인수 심사 진행)
              </p>
            </div>
          </div>

          {/* Department Connection Protocol - 3 Pillars */}
          <div className="p-4 rounded-xl bg-[#05080f] border border-stone-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-300 font-cinzel font-semibold shrink-0">
              <FileSignature className="w-4 h-4 text-amber-400" />
              <span>3-DEPARTMENT PROTOCOL:</span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 mb-1 font-editorial text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  영업부 (Sales & Initiation)
                </div>
                <div className="text-[11px] text-stone-300 leading-relaxed">
                  거래처 Q3 판매 실적 원장 집계, 판매장려금 기안, 한도 초과 시 영업 소명서 작성
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-indigo-200">
                <div className="font-bold flex items-center gap-1.5 mb-1 font-editorial text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  재무부 (Treasury & Verification)
                </div>
                <div className="text-[11px] text-stone-300 leading-relaxed">
                  계약 요율 산식 검산, 수취계좌 예금주 실명 증빙 확인, 펌뱅킹 지급 실행 및 일정 관리
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1 font-editorial text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  내부감시실 (Audit & Governance)
                </div>
                <div className="text-[11px] text-stone-300 leading-relaxed">
                  마실커머스/Celtonic 특수관계인 탐지, 기안자-승인자 직무분리(SoD) 통제, 감사로그 영구 기록
                </div>
              </div>
            </div>
          </div>

          {/* Principle Clarification Notice */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-stone-900/60 border border-stone-800 text-stone-400 text-[11px]">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-stone-200">W07 원본 규정 준수:</strong> 가상의 실험실·원료 배치를 인위적으로 심사 필수값에 추가하지 않고, 
              화장품 제조·유통 B2B 산업 맥락을 명확히 하되 원본 판매 실적 달성률, 거래처 계약 요율, 월 한도, 계좌 실명 증빙 기준 규칙을 엄격히 유지합니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
