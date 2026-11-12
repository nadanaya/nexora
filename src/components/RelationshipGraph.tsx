import React, { useState } from 'react';
import { 
  Building2, 
  FlaskConical, 
  ShoppingBag, 
  Dna, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Info,
  Network,
  Scale,
  GitBranch
} from 'lucide-react';
import { CORPORATE_ENTITIES, VENDORS } from '../data/initialData';
import { Vendor } from '../types';

interface RelationshipGraphProps {
  onSelectVendorReview?: (vendorName: string) => void;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  onSelectVendorReview,
}) => {
  const [selectedNode, setSelectedNode] = useState<string>('corevia-cosmetics');

  const selectedVendor = VENDORS.find(v => v.id === selectedNode);
  const selectedCorporate = CORPORATE_ENTITIES.find(c => c.id === selectedNode);

  return (
    <div className="space-y-4">
      {/* Overview Card with Sincere Legal-inspired executive styling */}
      <div className="bg-[#090e18] border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-xs font-bold text-amber-400 tracking-wider">
                § III. CROSS-HOLDING & AFFILIATION NETWORK
              </span>
              <span className="text-stone-600">|</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                특수관계 탐지율 60% (3/5건)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-editorial font-bold text-stone-100 mt-1 flex items-center gap-2">
              <Network className="w-5 h-5 text-amber-400" />
              Aurora 화장품 그룹 및 Corevia B2B 유통 거래처 관계망
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 font-sans">
              지주사(Aurora Holdings) - 제조(Corevia) - 유통(Masil) - 원료(Celtonic) 간 지분 및 특수관계자 교차지배 탐지 네트워크
            </p>
          </div>
        </div>

        {/* Visual Map Layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Graph Map */}
          <div className="lg:col-span-2 bg-[#05080f] p-6 rounded-2xl border border-stone-800 space-y-6 relative overflow-hidden">
            {/* Tier 1: Aurora Holdings */}
            <div className="flex justify-center">
              <button
                onClick={() => setSelectedNode('aurora-holdings')}
                className={`p-4 rounded-xl border transition text-center w-80 shadow-2xl cursor-pointer ${
                  selectedNode === 'aurora-holdings'
                    ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-[#090e18] border-stone-800 hover:border-amber-400'
                }`}
              >
                <div className="text-[10px] uppercase font-cinzel font-bold text-amber-400 tracking-widest">
                  PARENT HOLDING COMPANY
                </div>
                <div className="text-base font-editorial font-bold text-stone-100 mt-1">Aurora Holdings</div>
                <div className="text-[11px] text-stone-400 font-sans mt-0.5">전략 · M&A · 그룹 감사</div>
              </button>
            </div>

            {/* Connecting line */}
            <div className="w-0.5 h-6 bg-stone-800 mx-auto"></div>

            {/* Tier 2: Subsidiaries Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Celtonic Labs (M&A) */}
              <button
                onClick={() => setSelectedNode('celtonic-labs')}
                className={`p-3.5 rounded-xl border text-center transition cursor-pointer ${
                  selectedNode === 'celtonic-labs'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-[#090e18] border-dashed border-emerald-500/40 hover:border-emerald-400'
                }`}
              >
                <div className="text-[9px] font-cinzel font-bold text-emerald-400 tracking-wider">M&A TARGET</div>
                <div className="text-xs font-editorial font-bold text-stone-100 mt-0.5">Celtonic Labs</div>
                <div className="text-[10px] text-stone-400 font-sans mt-0.5">고기능 바이오 원료 R&D</div>
              </button>

              {/* Corevia Cosmetics (Main Manufacturer) */}
              <button
                onClick={() => setSelectedNode('corevia-cosmetics')}
                className={`p-4 rounded-xl border-2 text-center transition cursor-pointer shadow-xl shadow-rose-950/30 ${
                  selectedNode === 'corevia-cosmetics'
                    ? 'bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/50'
                    : 'bg-[#0e0914] border-rose-500 hover:bg-rose-950/30'
                }`}
              >
                <div className="text-[9px] font-cinzel font-bold text-rose-300 tracking-wider uppercase">W07 SUBJECT ENTITY</div>
                <div className="text-sm font-editorial font-bold text-stone-100 mt-0.5">Corevia Cosmetics</div>
                <div className="text-[10px] text-stone-300 font-sans mt-0.5">화장품 OEM/ODM 제조 & 영업</div>
              </button>

              {/* Masil Commerce (Retail/Logistics) */}
              <button
                onClick={() => setSelectedNode('masil-commerce')}
                className={`p-3.5 rounded-xl border text-center transition cursor-pointer ${
                  selectedNode === 'masil-commerce'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-[#090e18] border-stone-800 hover:border-indigo-400'
                }`}
              >
                <div className="text-[9px] font-cinzel font-bold text-indigo-400 tracking-wider">SUBSIDIARY 40%</div>
                <div className="text-xs font-editorial font-bold text-stone-100 mt-0.5">Masil Commerce</div>
                <div className="text-[10px] text-stone-400 font-sans mt-0.5">올리브영/면세/온라인 유통</div>
              </button>
            </div>

            {/* Connecting line */}
            <div className="w-0.5 h-6 bg-stone-800 mx-auto"></div>

            {/* Tier 3: 5 B2B Distributors / Vendors */}
            <div>
              <div className="text-[11px] font-cinzel font-bold text-stone-400 text-center mb-2.5 tracking-wider">
                COREVIA COSMETICS B2B REBATE RECIPIENTS (5 VENDORS)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {VENDORS.map((v) => {
                  const isSel = selectedNode === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedNode(v.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? 'bg-[#121929] border-amber-500 ring-2 ring-amber-500/30'
                          : v.isRelatedParty
                          ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-400'
                          : 'bg-[#090e18] border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-mono text-stone-400">{v.code}</span>
                          {v.isRelatedParty && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px]">
                              특수관계
                            </span>
                          )}
                        </div>
                        <div className="font-editorial font-bold text-xs text-stone-100 line-clamp-1">{v.name}</div>
                        <div className="text-[10px] text-stone-400 mt-0.5 font-sans">{v.category}</div>
                      </div>

                      <div className="mt-2.5 pt-1.5 border-t border-stone-800/80 text-[10px] text-stone-400 font-sans">
                        {v.relationType}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Col: Node Inspector Panel with Sincere Legal-inspired layout */}
          <div className="bg-[#05080f] p-5 rounded-2xl border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-stone-400 uppercase tracking-widest mb-3">
                <Info className="w-4 h-4 text-amber-400" />
                <span>AFFILIATION INSPECTOR</span>
              </div>

              {selectedCorporate && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
                    <span className="text-[10px] font-cinzel font-bold text-amber-400">{selectedCorporate.role}</span>
                    <h3 className="text-base font-editorial font-bold text-stone-100 mt-0.5">{selectedCorporate.name}</h3>
                    <p className="text-xs text-stone-300 mt-2 leading-relaxed font-sans">{selectedCorporate.description}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800/80 text-xs text-stone-300 space-y-1 font-sans">
                    <div className="font-semibold text-white">역할 및 통제 범위:</div>
                    <div>• 그룹 태그: {selectedCorporate.tag}</div>
                    <div>• W07 직접 대상: {selectedCorporate.isW07Target ? '예 (제조 및 장려금 집행 주체)' : '그룹 내부통제 및 거래 파트너'}</div>
                  </div>
                </div>
              )}

              {selectedVendor && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-stone-900 border border-stone-800">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-stone-400">{selectedVendor.code}</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px] font-sans">
                        {selectedVendor.category}
                      </span>
                    </div>
                    <h3 className="text-base font-editorial font-bold text-stone-100">{selectedVendor.name}</h3>
                    <div className="text-xs text-stone-300 mt-1 font-sans">대표자: {selectedVendor.representative}</div>
                  </div>

                  {/* Relationship Risk Status */}
                  <div className={`p-3 rounded-xl border text-xs space-y-1 font-sans ${
                    selectedVendor.isRelatedParty 
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
                      : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {selectedVendor.isRelatedParty ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      <span>{selectedVendor.relationType}</span>
                    </div>
                    {selectedVendor.shareholdingPct && (
                      <div>지분율: <strong className="text-white font-mono">{selectedVendor.shareholdingPct}%</strong></div>
                    )}
                    <p className="text-[11px] text-stone-300 pt-1 leading-relaxed">
                      {selectedVendor.isRelatedParty 
                        ? '오로라 그룹 거버넌스 및 공정거래 내부통제 규정에 따라 감사위원회 사전심의 대상 거래처입니다.' 
                        : '독립 제3자 거래처로서 정상 판매실적 검산에 따라 지급됩니다.'}
                    </p>
                  </div>

                  {/* Bank info */}
                  <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-xs text-stone-300 space-y-1 font-sans">
                    <div className="font-semibold text-white">등록 펌뱅킹 수취계좌:</div>
                    <div className="font-mono text-[11px]">{selectedVendor.registeredBankAccount.bank} {selectedVendor.registeredBankAccount.accountNumber}</div>
                    <div className="text-[11px]">
                      예금주: <strong className="text-stone-100">{selectedVendor.registeredBankAccount.accountHolder}</strong>
                      {selectedVendor.registeredBankAccount.isVerified ? (
                        <span className="text-emerald-400 font-bold ml-1.5">✓ 실명 일치</span>
                      ) : (
                        <span className="text-rose-400 font-bold ml-1.5">⚠ 상호 불일치</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedVendor && onSelectVendorReview && (
              <button
                onClick={() => onSelectVendorReview(selectedVendor.name)}
                className="mt-4 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950 font-cinzel tracking-wider"
              >
                <span>이 거래처의 Q3 판매장려금 심사 열기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
