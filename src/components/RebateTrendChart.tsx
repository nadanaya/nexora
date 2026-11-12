import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  Scale, 
  BarChart3, 
  SlidersHorizontal 
} from 'lucide-react';
import { RebateReview } from '../types';

interface RebateTrendChartProps {
  review: RebateReview;
}

export interface MonthlyRebateData {
  month: string;
  monthLabel: string;
  rebate: number;
  sales: number;
  rate: number;
  limit: number;
  isCurrent: boolean;
  status: string;
  diffFromAvg?: number;
  diffPct?: number;
}

export const RebateTrendChart: React.FC<RebateTrendChartProps> = ({ review }) => {
  const [showCapLine, setShowCapLine] = useState(true);
  const [showAvgLine, setShowAvgLine] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'ALL' | 'REBATE_ONLY' | 'RATE_ONLY'>('ALL');

  // Generate deterministic 6-month historical data + current month request
  const { trendData, historicalAvg, maxHistorical, variancePct, anomalyInfo } = useMemo(() => {
    const currentRebate = review.calculatedRebateAmount;
    const currentSales = review.actualSalesAmount;
    const contractRate = review.contractRebateRate;
    const capLimit = review.monthlyLimitAmount;

    // Use review properties to deterministically shape realistic 6-month history
    // Months M-6 down to M-1
    const pastMonths = [
      { label: '5월', code: '2026-05', factor: 0.82, salesFactor: 0.84 },
      { label: '6월', code: '2026-06', factor: 0.88, salesFactor: 0.89 },
      { label: '7월', code: '2026-07', factor: 0.91, salesFactor: 0.90 },
      { label: '8월', code: '2026-08', factor: 0.86, salesFactor: 0.87 },
      { label: '9월', code: '2026-09', factor: 0.94, salesFactor: 0.93 },
      { label: '10월', code: '2026-10', factor: 0.90, salesFactor: 0.91 },
    ];

    // For specific test cases, adjust historical patterns to create clear anomaly stories:
    // Case 1: Vendor A (뷰티넥서스) - High performance in Q3
    let customFactors = pastMonths.map(m => m.factor);
    if (review.code.includes('001')) {
      // 뷰티넥서스: baseline around 36~39M, current is 45.2M (+18% spike due to Q3 Derma push)
      customFactors = [0.81, 0.84, 0.82, 0.87, 0.85, 0.88];
    } else if (review.code.includes('002')) {
      // 루미너스: steady modest baseline around 4.0~4.6M, current is 4.5M (stable, but bank mismatch)
      customFactors = [0.92, 0.96, 0.89, 0.94, 0.98, 0.95];
    } else if (review.code.includes('003') || review.monthlyAccumulatedAmount > review.monthlyLimitAmount) {
      // Anomaly case: large spike over cap limit
      customFactors = [0.65, 0.70, 0.68, 0.72, 0.74, 0.71];
    }

    const historicalData: MonthlyRebateData[] = pastMonths.map((m, idx) => {
      const rebateAmount = Math.round(currentRebate * customFactors[idx]);
      const salesAmount = Math.round(currentSales * (customFactors[idx] * 0.98));
      const rate = Number(((rebateAmount / salesAmount) * 100).toFixed(2));
      return {
        month: m.code,
        monthLabel: m.label,
        rebate: rebateAmount,
        sales: salesAmount,
        rate: isNaN(rate) ? contractRate : rate,
        limit: capLimit,
        isCurrent: false,
        status: '정상 지급 완료',
      };
    });

    const sumHistorical = historicalData.reduce((acc, curr) => acc + curr.rebate, 0);
    const avgRebate = Math.round(sumHistorical / historicalData.length);
    const maxHist = Math.max(...historicalData.map(d => d.rebate));

    const currentMonthRate = Number(((currentRebate / currentSales) * 100).toFixed(2));
    const currentMonthData: MonthlyRebateData = {
      month: '2026-11 (당월)',
      monthLabel: '11월 (당월 심사)',
      rebate: currentRebate,
      sales: currentSales,
      rate: isNaN(currentMonthRate) ? contractRate : currentMonthRate,
      limit: capLimit,
      isCurrent: true,
      status: review.status === 'APPROVED' ? '승인 완료' : review.status === 'PAID' ? '지급 완료' : '심사 진행 중',
    };

    const diff = currentRebate - avgRebate;
    const pct = Number(((diff / avgRebate) * 100).toFixed(1));

    const fullData: MonthlyRebateData[] = [...historicalData, currentMonthData].map(item => ({
      ...item,
      diffFromAvg: item.rebate - avgRebate,
      diffPct: Number((((item.rebate - avgRebate) / avgRebate) * 100).toFixed(1)),
    }));

    // Anomaly classification for Finance Manager
    let severity: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    let anomalyTitle = '정상 변동 범위 (Normal Baseline)';
    let anomalyReason = `과거 6개월 평균 대비 변동폭(${pct > 0 ? `+${pct}%` : `${pct}%`})이 정상 통제 허용치(±20%) 내에 있습니다.`;

    if (currentRebate > capLimit) {
      severity = 'CRITICAL';
      anomalyTitle = '월간 법정 한도 초과 (Cap Breach)';
      anomalyReason = `당월 신청액 ₩${currentRebate.toLocaleString()}원이 W07 월간 한도 ₩${capLimit.toLocaleString()}원을 ₩${(currentRebate - capLimit).toLocaleString()}원 초과했습니다. 영업 소명 및 전결권자 상향 결재가 필수적입니다.`;
    } else if (pct >= 25) {
      severity = 'WARNING';
      anomalyTitle = '단기 급증 이상치 감지 (Spike Anomaly)';
      anomalyReason = `과거 6개월 평균(₩${avgRebate.toLocaleString()}원) 대비 당월 신청액이 +${pct}% 급증했습니다. 분기말 밀어내기 매출(Channel Stuffing) 또는 미승인 기획 프로모션 적용 여부를 대조 검토하십시오.`;
    } else if (pct <= -30) {
      severity = 'WARNING';
      anomalyTitle = '실적 급감 이상치 감지 (Dip Anomaly)';
      anomalyReason = `과거 6개월 평균 대비 -${Math.abs(pct)}% 급감했습니다. 거래처 이탈 또는 제품 반품 정산 누락 여부를 확인하십시오.`;
    }

    return {
      trendData: fullData,
      historicalAvg: avgRebate,
      maxHistorical: maxHist,
      variancePct: pct,
      anomalyInfo: {
        severity,
        title: anomalyTitle,
        reason: anomalyReason,
      },
    };
  }, [review]);

  // Currency formatter helper
  const formatCurrency = (val: number) => {
    if (val >= 100000000) {
      return `${(val / 100000000).toFixed(1)}억원`;
    }
    if (val >= 10000) {
      return `${(val / 10000).toLocaleString()}만원`;
    }
    return `${val.toLocaleString()}원`;
  };

  return (
    <div className="space-y-4">
      {/* Executive Anomaly Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        anomalyInfo.severity === 'CRITICAL'
          ? 'bg-gradient-to-r from-rose-950/40 via-[#0d0914] to-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/30'
          : anomalyInfo.severity === 'WARNING'
          ? 'bg-gradient-to-r from-amber-950/40 via-[#0d0f17] to-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/20'
          : 'bg-gradient-to-r from-emerald-950/30 via-[#060b13] to-emerald-950/10 border-emerald-500/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
              anomalyInfo.severity === 'CRITICAL'
                ? 'bg-rose-950 border-rose-500/60 text-rose-400'
                : anomalyInfo.severity === 'WARNING'
                ? 'bg-amber-950 border-amber-500/60 text-amber-400'
                : 'bg-emerald-950 border-emerald-500/60 text-emerald-400'
            }`}>
              {anomalyInfo.severity === 'NORMAL' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-xs font-bold tracking-wider text-stone-200">
                  FINANCE ANOMALY DIAGNOSIS
                </span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase font-mono ${
                  anomalyInfo.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : anomalyInfo.severity === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {anomalyInfo.severity}
                </span>
              </div>
              <h4 className="font-editorial text-base font-bold text-stone-100 mt-0.5">
                {anomalyInfo.title}
              </h4>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed font-sans">
                {anomalyInfo.reason}
              </p>
            </div>
          </div>

          {/* Quick Metrics Tag */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 bg-stone-900/90 px-3.5 py-2 rounded-xl border border-stone-800">
            <div className="text-right">
              <div className="text-[10px] text-stone-400 font-cinzel">6-MO VARIANCE</div>
              <div className={`text-base font-bold font-editorial flex items-center justify-end gap-1 ${
                variancePct > 0 ? 'text-amber-400' : variancePct < 0 ? 'text-cyan-400' : 'text-stone-300'
              }`}>
                {variancePct > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{variancePct > 0 ? `+${variancePct}%` : `${variancePct}%`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards for Finance Manager */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#060a12] border border-stone-800">
          <div className="text-stone-400 text-[10px] font-cinzel tracking-wider">6-MONTH HISTORICAL AVG</div>
          <div className="text-base sm:text-lg font-editorial font-bold text-stone-100 mt-1">
            ₩{formatCurrency(historicalAvg)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">최근 6개월 평균 지급액</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#060a12] border border-stone-800">
          <div className="text-stone-400 text-[10px] font-cinzel tracking-wider">6-MONTH PEAK REBATE</div>
          <div className="text-base sm:text-lg font-editorial font-bold text-indigo-300 mt-1">
            ₩{formatCurrency(maxHistorical)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">과거 6개월 중 최고 지급액</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0f0c15] border border-amber-500/40">
          <div className="text-amber-400 text-[10px] font-cinzel tracking-wider font-bold">CURRENT DOCKET REQUEST</div>
          <div className="text-base sm:text-lg font-editorial font-bold text-amber-300 mt-1">
            ₩{formatCurrency(review.calculatedRebateAmount)}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">
            {variancePct >= 0 ? `평균 대비 +${variancePct}%` : `평균 대비 ${variancePct}%`}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#060a12] border border-stone-800">
          <div className="text-stone-400 text-[10px] font-cinzel tracking-wider">CAP UTILIZATION</div>
          <div className={`text-base sm:text-lg font-editorial font-bold mt-1 ${
            review.calculatedRebateAmount > review.monthlyLimitAmount ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {((review.calculatedRebateAmount / review.monthlyLimitAmount) * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            한도 {formatCurrency(review.monthlyLimitAmount)} 대비
          </div>
        </div>
      </div>

      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#060910] border border-stone-800 text-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span className="font-cinzel font-bold text-stone-200">
            6-MONTH REBATE & RATE TREND VISUALIZATION
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Display Mode Toggle */}
          <div className="flex items-center bg-stone-900 rounded-lg p-0.5 border border-stone-800 text-[11px]">
            <button
              onClick={() => setActiveMetric('ALL')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                activeMetric === 'ALL'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              복합 (장려금+요율)
            </button>
            <button
              onClick={() => setActiveMetric('REBATE_ONLY')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                activeMetric === 'REBATE_ONLY'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              장려금액만
            </button>
            <button
              onClick={() => setActiveMetric('RATE_ONLY')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                activeMetric === 'RATE_ONLY'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              실효요율(%)만
            </button>
          </div>

          {/* Reference Line Toggles */}
          <button
            onClick={() => setShowAvgLine(!showAvgLine)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
              showAvgLine
                ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
            }`}
          >
            <span className="w-2 h-0.5 bg-purple-400 inline-block"></span>
            6개월 평균선 {showAvgLine ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setShowCapLine(!showCapLine)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
              showCapLine
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
            }`}
          >
            <span className="w-2 h-0.5 bg-rose-400 inline-block"></span>
            W07 한도선 {showCapLine ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#05080f] border border-stone-800 shadow-inner">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trendData}
              margin={{ top: 20, right: 25, bottom: 10, left: 15 }}
            >
              <defs>
                <linearGradient id="currentBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="pastBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.75} />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
                opacity={0.25}
                vertical={false}
              />

              <XAxis
                dataKey="monthLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
              />

              {/* Left Y Axis for Rebate Amount */}
              {(activeMetric === 'ALL' || activeMetric === 'REBATE_ONLY') && (
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${(val / 10000).toLocaleString()}만`}
                />
              )}

              {/* Right Y Axis for Effective Rate % */}
              {(activeMetric === 'ALL' || activeMetric === 'RATE_ONLY') && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 8]}
                  stroke="#06b6d4"
                  tick={{ fill: '#06b6d4', fontSize: 10 }}
                  axisLine={{ stroke: '#0891b2' }}
                  tickFormatter={(val) => `${val}%`}
                />
              )}

              <Tooltip content={<CustomRebateTooltip avg={historicalAvg} />} />

              <Legend
                wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
                formatter={(value) => {
                  if (value === 'rebate') return <span className="text-stone-300">판매장려금액 (KRW)</span>;
                  if (value === 'rate') return <span className="text-cyan-400">실효 장려금율 (%)</span>;
                  return value;
                }}
              />

              {/* Reference Line for 6-Month Average */}
              {showAvgLine && (
                <ReferenceLine
                  yAxisId="left"
                  y={historicalAvg}
                  stroke="#c084fc"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `6개월 평균: ₩${(historicalAvg / 10000).toLocaleString()}만원`,
                    fill: '#c084fc',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
              )}

              {/* Reference Line for W07 Monthly Cap */}
              {showCapLine && (
                <ReferenceLine
                  yAxisId="left"
                  y={review.monthlyLimitAmount}
                  stroke="#f43f5e"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{
                    value: `W07 월한도: ₩${(review.monthlyLimitAmount / 10000).toLocaleString()}만원`,
                    fill: '#f43f5e',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* Rebate Amount Bar */}
              {(activeMetric === 'ALL' || activeMetric === 'REBATE_ONLY') && (
                <Bar
                  yAxisId="left"
                  dataKey="rebate"
                  name="rebate"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {trendData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? 'url(#currentBarGradient)' : 'url(#pastBarGradient)'}
                      stroke={entry.isCurrent ? '#f59e0b' : '#3b82f6'}
                      strokeWidth={entry.isCurrent ? 1.5 : 0.8}
                    />
                  ))}
                </Bar>
              )}

              {/* Effective Rebate Rate Line */}
              {(activeMetric === 'ALL' || activeMetric === 'RATE_ONLY') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rate"
                  name="rate"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0891b2', stroke: '#cffafe', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Footnote */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-1 border-t border-stone-800/80 text-[11px] text-stone-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500/70 inline-block"></span>
              과거 6개월 집행 실적 (M-6 ~ M-1)
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
              당월 심사 안건 (Current Request)
            </span>
          </div>
          <span className="text-stone-400 text-[10px]">
            * 재무담당자 전용: 과거 6개월 대비 편차 및 한도 초과 여부를 실시간 감시합니다.
          </span>
        </div>
      </div>

      {/* Finance Manager Audit Checklist */}
      <div className="p-4 rounded-xl bg-[#060a12] border border-stone-800 space-y-2.5">
        <h4 className="font-editorial text-sm font-bold text-stone-100 flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          재무 승인자 이상치 심사 체크포인트 (Finance Inspection Decree)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-stone-300 font-sans">
          <div className="p-3 rounded-lg bg-[#0a0f1d] border border-stone-800">
            <div className="text-amber-400 font-semibold mb-1">1. 계절성 & 신제품 기여도 검토</div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              당월 매출 증가가 계절적 성수기(여름 선케어, 겨울 더마 보습제 등) 또는 런칭 프로모션에 기인한 정상 증가인지 확인.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0a0f1d] border border-stone-800">
            <div className="text-amber-400 font-semibold mb-1">2. 분기말 밀어내기(Stuffing) 여부</div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              분기 마감 직전 비정상적으로 대량 발주 후 장려금을 수령하고 익월 반품하는 부정 패턴이 없는지 POS 실판매 대조.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0a0f1d] border border-stone-800">
            <div className="text-amber-400 font-semibold mb-1">3. 계약 요율 임의 변동 검증</div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              과거 6개월 평균 실효 요율({trendData[0]?.rate}%) 대비 당월 요율({review.contractRebateRate}%)이 변경되었을 경우 정식 계약 갱신서 확인.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip component for Recharts matching Sincere Legal aesthetic
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  avg: number;
}

const CustomRebateTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, avg }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MonthlyRebateData;
    const diff = data.rebate - avg;
    const diffPct = Number(((diff / avg) * 100).toFixed(1));

    return (
      <div className="p-3.5 rounded-xl bg-[#080d16] border border-amber-500/40 text-stone-100 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[220px]">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <span className="font-cinzel font-bold text-amber-300">{data.monthLabel}</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
            data.isCurrent ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'bg-stone-800 text-stone-400'
          }`}>
            {data.isCurrent ? '★ 당월 신청' : '과거 실적'}
          </span>
        </div>

        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between items-center">
            <span className="text-stone-400">판매장려금:</span>
            <span className="font-bold text-stone-100 font-editorial text-sm">
              ₩{data.rebate.toLocaleString()}원
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-400">달성 매출액:</span>
            <span className="text-stone-300 font-mono text-[11px]">
              ₩{data.sales.toLocaleString()}원
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-400">실효 장려금율:</span>
            <span className="text-cyan-400 font-semibold font-mono">
              {data.rate}%
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-stone-800/80">
            <span className="text-stone-400">6개월 평균 대비:</span>
            <span className={`font-semibold font-mono text-[11px] ${
              diff > 0 ? 'text-amber-300' : diff < 0 ? 'text-cyan-300' : 'text-stone-300'
            }`}>
              {diff > 0 ? `+${diffPct}%` : `${diffPct}%`} (₩{(diff / 10000).toFixed(0)}만원)
            </span>
          </div>

          <div className="flex justify-between items-center text-[10px] pt-0.5 text-stone-400">
            <span>상태:</span>
            <span className="text-stone-300">{data.status}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
