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
  Network
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
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-rose-400" />
              Aurora 화장품 그룹 및 Corevia B2B 유통 거래처 관계망
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              지주사(Aurora Holdings) - 제조(Corevia) - 유통(Masil) - 원료(Celtonic) 간 지분 및 특수관계자 교차지배 탐지 네트워크
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            특수관계 탐지율 60% (3/5건)
          </span>
        </div>

        {/* Visual Map Layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Graph Map */}
          <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-6 relative overflow-hidden">
            {/* Tier 1: Aurora Holdings */}
            <div className="flex justify-center">
              <button
                onClick={() => setSelectedNode('aurora-holdings')}
                className={`p-3.5 rounded-2xl border transition text-center w-72 shadow-xl cursor-pointer ${
                  selectedNode === 'aurora-holdings'
                    ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-700 hover:border-amber-400'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  그룹 지주사 (Parent Holding)
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">Aurora Holdings</div>
                <div className="text-[11px] text-slate-400">전략 · M&A · 그룹 감사</div>
              </button>
            </div>

            {/* Connecting line */}
            <div className="w-0.5 h-6 bg-slate-700 mx-auto"></div>

            {/* Tier 2: Subsidiaries Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Celtonic Labs (M&A) */}
              <button
                onClick={() => setSelectedNode('celtonic-labs')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  selectedNode === 'celtonic-labs'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900 border-dashed border-emerald-500/50 hover:border-emerald-400'
                }`}
              >
                <div className="text-[9px] font-bold text-emerald-400">M&A 실사 진행 중</div>
                <div className="text-xs font-bold text-white mt-0.5">Celtonic Labs</div>
                <div className="text-[10px] text-slate-400">고기능 바이오 원료 R&D</div>
              </button>

              {/* Corevia Cosmetics (Main Manufacturer) */}
              <button
                onClick={() => setSelectedNode('corevia-cosmetics')}
                className={`p-3.5 rounded-xl border-2 text-center transition cursor-pointer shadow-lg shadow-rose-950/40 ${
                  selectedNode === 'corevia-cosmetics'
                    ? 'bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/50'
                    : 'bg-rose-950/20 border-rose-500 hover:bg-rose-950/30'
                }`}
              >
                <div className="text-[9px] font-extrabold text-rose-300 uppercase">W07 주관 제조사</div>
                <div className="text-sm font-black text-white mt-0.5">Corevia Cosmetics</div>
                <div className="text-[10px] text-slate-300">화장품 OEM/ODM 제조 & 영업</div>
              </button>

              {/* Masil Commerce (Retail/Logistics) */}
              <button
                onClick={() => setSelectedNode('masil-commerce')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  selectedNode === 'masil-commerce'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-900 border-slate-700 hover:border-indigo-400'
                }`}
              >
                <div className="text-[9px] font-bold text-indigo-400">유통 자회사 (지분 40%)</div>
                <div className="text-xs font-bold text-white mt-0.5">Masil Commerce</div>
                <div className="text-[10px] text-slate-400">올리브영/면세/온라인 유통</div>
              </button>
            </div>

            {/* Connecting line */}
            <div className="w-0.5 h-6 bg-slate-700 mx-auto"></div>

            {/* Tier 3: 5 B2B Distributors / Vendors */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 text-center mb-2">
                Corevia Cosmetics 분기 판매장려금 심사 대상 거래처 (5개소)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {VENDORS.map((v) => {
                  const isSel = selectedNode === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedNode(v.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/30'
                          : v.isRelatedParty
                          ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-mono text-slate-400">{v.code}</span>
                          {v.isRelatedParty && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px]">
                              특수관계
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-xs text-white line-clamp-1">{v.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{v.category}</div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                        {v.relationType}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Col: Node Inspector Panel */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>관계 분석 인스펙터</span>
              </div>

              {selectedCorporate && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold text-rose-400">{selectedCorporate.role}</span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">{selectedCorporate.name}</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedCorporate.description}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-white">역할 및 통제 범위:</div>
                    <div>• 그룹 태그: {selectedCorporate.tag}</div>
                    <div>• W07 직접 대상: {selectedCorporate.isW07Target ? '예 (제조 및 장려금 집행 주체)' : '그룹 내부통제 및 거래 파트너'}</div>
                  </div>
                </div>
              )}

              {selectedVendor && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-slate-400">{selectedVendor.code}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {selectedVendor.category}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">{selectedVendor.name}</h3>
                    <div className="text-xs text-slate-300 mt-1">대표자: {selectedVendor.representative}</div>
                  </div>

                  {/* Relationship Risk Status */}
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    selectedVendor.isRelatedParty 
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
                      : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {selectedVendor.isRelatedParty ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      <span>{selectedVendor.relationType}</span>
                    </div>
                    {selectedVendor.shareholdingPct && (
                      <div>지분율: <strong className="text-white">{selectedVendor.shareholdingPct}%</strong></div>
                    )}
                    <p className="text-[11px] text-slate-300 pt-1">
                      {selectedVendor.isRelatedParty 
                        ? '오로라 그룹 거버넌스 및 공정거래 내부통제 규정에 따라 감사위원회 사전심의 대상 거래처입니다.' 
                        : '독립 제3자 거래처로서 정상 판매실적 검산에 따라 지급됩니다.'}
                    </p>
                  </div>

                  {/* Bank info */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-white">등록 펌뱅킹 수취계좌:</div>
                    <div className="font-mono text-[11px]">{selectedVendor.registeredBankAccount.bank} {selectedVendor.registeredBankAccount.accountNumber}</div>
                    <div className="text-[11px]">
                      예금주: <strong className="text-slate-100">{selectedVendor.registeredBankAccount.accountHolder}</strong>
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
                className="mt-4 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-950"
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
