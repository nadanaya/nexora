import React from 'react';
import { 
  X, 
  HelpCircle, 
  Building2, 
  FlaskConical, 
  ShoppingBag, 
  Dna, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  SendHorizontal,
  Scale,
  ScrollText
} from 'lucide-react';

interface AppGuideModalProps {
  onClose: () => void;
}

export const AppGuideModal: React.FC<AppGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#090e18] border border-stone-800 rounded-3xl max-w-3xl w-full my-auto p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header with Sincere Legal-inspired typography */}
        <div className="flex items-start justify-between pb-3.5 border-b border-stone-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <div className="font-cinzel text-xs font-bold text-amber-400 tracking-wider">
                EXECUTIVE OPERATIONAL MANUAL
              </div>
              <h2 className="text-lg sm:text-xl font-editorial font-bold text-stone-100 tracking-tight mt-0.5">
                NEXORA 업무 프로토콜 및 시연 가이드
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                가상 화장품 그룹 Aurora 제조사 Corevia Cosmetics 판매장려금 거버넌스 시스템
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

        {/* 1. Corporate Context */}
        <div className="p-4 rounded-2xl bg-[#05080f] border border-stone-800 space-y-2 text-xs font-sans">
          <h3 className="font-editorial text-sm font-bold text-stone-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            1. 실제 과제 기업 구조 및 과제 정의 (Samil PwC W07)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-stone-300">
            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <span className="font-editorial font-bold text-amber-300 text-sm block mb-0.5">Aurora Holdings</span>
              화장품 그룹 지주사 (전략·투자·재무·내부감시)
            </div>
            <div className="p-3 rounded-xl bg-[#0e0914] border border-rose-500/30">
              <span className="font-editorial font-bold text-rose-300 text-sm block mb-0.5">Corevia Cosmetics</span>
              화장품 제조사 (W07 주관: 원료조달·생산·품질·기업고객영업)
            </div>
            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <span className="font-editorial font-bold text-indigo-300 text-sm block mb-0.5">Masil Commerce</span>
              화장품 유통 자회사 (H&B스토어·온라인 채널·물류배송)
            </div>
            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <span className="font-editorial font-bold text-emerald-300 text-sm block mb-0.5">Celtonic Labs</span>
              화장품 바이오 원료 기업 (M&A 인수 심사 대상)
            </div>
          </div>
          <p className="text-stone-400 text-[11px] pt-1 leading-relaxed">
            NEXORA는 단순한 핀테크 플랫폼이 아니며, 화장품 제조·유통 산업의 거래처 관계와 판매장려금 의사결정을 AI와 사람이 함께 검증·집행하는 기업 거버넌스 시스템입니다.
          </p>
        </div>

        {/* 2. 3-Department Workflow */}
        <div className="p-4 rounded-2xl bg-[#05080f] border border-stone-800 space-y-3 text-xs font-sans">
          <h3 className="font-editorial text-sm font-bold text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            2. 부서별 의사결정 연결 및 직무 분리(SoD)
          </h3>
          <div className="space-y-2 text-stone-300">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-[10px] shrink-0 mt-0.5">
                영업부
              </span>
              <div>
                <strong>김영업 대리 (기안자):</strong> 거래처별 분기 판매 실적 집계, 장려금 기안 신청, 한도 초과 시 소명서 작성. 
                <span className="text-amber-300 ml-1">※ 기안자는 자기 결재 방지를 위해 승인 권한이 제한됩니다 (SoD).</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold text-[10px] shrink-0 mt-0.5">
                재무부
              </span>
              <div>
                <strong>이재무 과장 (승인·지급):</strong> 산식 검산 및 월 합산액 확인, 수취계좌 예금주 실명 증빙 검증, 승인 처리 및 펌뱅킹 모의 송금 실행.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold text-[10px] shrink-0 mt-0.5">
                내부감시
              </span>
              <div>
                <strong>박감사 팀장 (감사관):</strong> 지주사 및 계열사 교차지배 거래처 특수관계인 탐지, 불공정 거래 차단, 감사위원회 사전 안건 상정.
              </div>
            </div>
          </div>
        </div>

        {/* 3. Demo Scenarios */}
        <div className="p-4 rounded-2xl bg-[#05080f] border border-stone-800 space-y-3 text-xs font-sans">
          <h3 className="font-editorial text-sm font-bold text-stone-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            3. 삼일PwC 평가위원 시연 핵심 시나리오
          </h3>
          <div className="space-y-2 text-stone-300 text-[11px]">
            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <div className="font-editorial font-bold text-stone-100 text-sm mb-0.5">시나리오 1: 진행 심사 건 승인 및 카운트 갱신</div>
              <div className="text-stone-300 leading-relaxed">대시보드의 <strong>[진행 심사 5건]</strong> 카드를 클릭하여 뷰티넥서스 건을 상세 조회한 뒤, 상단에서 <strong>이재무 과장</strong> 역할로 [재무 승인]을 누르면 대시보드 진행 심사가 <strong>5건 → 4건</strong>으로 즉시 줄어들고 감사로그가 기록됩니다.</div>
            </div>

            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <div className="font-editorial font-bold text-stone-100 text-sm mb-0.5">시나리오 2: 후속 작업 영업 소명서 작성</div>
              <div className="text-stone-300 leading-relaxed"><strong>[열린 후속 작업 4건]</strong>에서 에이치앤비 리테일파트너스 한도 초과 건의 [소명서 제출]을 실행하면 열린 후속 작업이 <strong>4건 → 3건</strong>으로 줄어들고 소명 증빙이 등록됩니다.</div>
            </div>

            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <div className="font-editorial font-bold text-stone-100 text-sm mb-0.5">시나리오 3: 모의 펌뱅킹 이체 실행</div>
              <div className="text-stone-300 leading-relaxed">승인 완료된 심사 건의 [모의지급] 버튼을 눌러 계좌 실명 확인 후 1-클릭 전신환 송금을 실행하면 고유 영수증 번호가 발급되며 [지급 완료] 상태로 이전됩니다.</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition cursor-pointer font-cinzel tracking-wider"
        >
          확인했습니다 (닫기)
        </button>
      </div>
    </div>
  );
};
