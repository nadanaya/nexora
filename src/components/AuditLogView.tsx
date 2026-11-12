import React, { useState } from 'react';
import { 
  History, 
  Search, 
  ShieldCheck, 
  Filter, 
  User, 
  ArrowRight,
  FileCheck2,
  Calendar,
  Scale
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SALES' | 'FINANCE' | 'AUDIT'>('ALL');

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.vendorName && log.vendorName.toLowerCase().includes(q)) ||
      (log.reviewCode && log.reviewCode.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (roleFilter !== 'ALL' && log.actorRole !== roleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header and Controls - Executive Sincere Bar */}
      <div className="bg-[#090e18] border border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-xs font-bold text-amber-400 tracking-wider">
              § IV. COMPLIANCE AUDIT TRAIL
            </span>
            <span className="text-stone-600">|</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              IMMUTABLE RECORD
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-editorial font-bold text-stone-100 mt-1 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            NEXORA 불변 감사 로그 대장 (Audit Trail)
          </h2>
          <p className="text-xs text-stone-400 mt-0.5 font-sans">
            화장품 거래처 판매장려금 기안, AI 특수관계자 검증, 재무 승인, 소명서 제출 및 모의 송금 전산 기록
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <div className="flex items-center rounded-lg bg-stone-900 p-0.5 border border-stone-800 text-xs">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                roleFilter === 'ALL' ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setRoleFilter('SALES')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                roleFilter === 'SALES' ? 'bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/40' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              영업
            </button>
            <button
              onClick={() => setRoleFilter('FINANCE')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                roleFilter === 'FINANCE' ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              재무
            </button>
            <button
              onClick={() => setRoleFilter('AUDIT')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                roleFilter === 'AUDIT' ? 'bg-amber-600/30 text-amber-300 font-bold border border-amber-500/40' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              감사
            </button>
          </div>

          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="감사 기록 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 text-stone-200 placeholder-stone-500 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Logs Timeline List */}
      <div className="bg-[#090e18] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-stone-800/60">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 sm:p-4.5 hover:bg-stone-900/40 transition text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.actorRole === 'SALES' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                    log.actorRole === 'FINANCE' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' :
                    'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    {log.actorRole} · {log.actorName}
                  </span>
                  <span className="font-editorial font-bold text-stone-100 text-sm">{log.action}</span>
                  {log.reviewCode && (
                    <span className="font-mono text-[11px] text-amber-300 font-bold bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                      {log.reviewCode}
                    </span>
                  )}
                  {log.vendorName && (
                    <span className="text-stone-400 text-xs font-sans">({log.vendorName})</span>
                  )}
                </div>

                <p className="text-stone-300 text-xs leading-relaxed max-w-4xl">
                  {log.details}
                </p>

                {log.prevStatus && log.nextStatus && (
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 pt-0.5 font-mono">
                    <span className="px-1.5 py-0.2 rounded bg-stone-900 text-stone-300">{log.prevStatus}</span>
                    <ArrowRight className="w-3 h-3 text-stone-600" />
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold">{log.nextStatus}</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-stone-400 font-mono shrink-0 flex items-center gap-1 bg-[#05080f] px-2.5 py-1 rounded border border-stone-800">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
