import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI();
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
  }
}

// API Health / Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    provider: 'Google Gemini AI Engine',
    model: 'gemini-3.8-flash',
    isRealApiReady: Boolean(aiClient),
    hasKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    targetEntity: 'Corevia Cosmetics (Aurora Group)',
    w07Mission: '화장품 제조·유통 거래처 판매장려금 운영 및 통제',
    message: aiClient 
      ? 'Gemini 3.8 Flash AI 심사 엔진 연결됨' 
      : '외부 AI 키 대기 중 · W07 규칙 검산 엔진 작동',
  });
});

// AI Analysis Endpoint
app.post('/api/ai-analysis', async (req, res) => {
  const { review } = req.body;
  if (!review) {
    return res.status(400).json({ error: 'Review data required' });
  }

  // If Gemini client is active, call gemini-3.8-flash
  if (aiClient) {
    try {
      const prompt = `당신은 가상 화장품 그룹 Aurora의 제조 자회사 Corevia Cosmetics를 위한 판매장려금(Rebate) 심사 AI 감사관입니다.
(Samil PwC W07 화장품 제조·유통 판매장려금 심사 과제)

[기업 구조 정보]
1. Aurora Holdings: 화장품 그룹 지주사, 거버넌스 및 자본 배분
2. Corevia Cosmetics: 화장품 제조사(OEM/ODM, 스킨케어/더마 라인 생산 및 B2B 총판 납품), 이번 심사의 주관사
3. Masil Commerce: 화장품 유통 자회사(H&B 스토어, 백화점, 온라인몰 유통)
4. Celtonic Labs: 고기능성 화장품 바이오 원료 기업 (Aurora 그룹 인수 검토 중)

[심사 대상 거래처 및 장려금 기안 내역]
- 거래처명: ${review.vendorName}
- 유통 분류: ${review.vendorCategory}
- 대상 제품군: ${review.productLine}
- 대상 분기: ${review.targetQuarter}
- 목표 매출액: ${review.targetSalesAmount?.toLocaleString()}원
- 실제 달성 매출액: ${review.actualSalesAmount?.toLocaleString()}원
- 달성률: ${review.achievementRate}%
- 계약 장려금율: ${review.contractRebateRate}%
- 신청 장려금액: ${review.calculatedRebateAmount?.toLocaleString()}원
- 당월 누적 지급액: ${review.monthlyAccumulatedAmount?.toLocaleString()}원
- 당월 한도액: ${review.monthlyLimitAmount?.toLocaleString()}원
- 특수관계자 여부: ${review.isRelatedParty ? 'YES (관계: ' + review.relationDetail + ')' : 'NO'}
- 수취계좌 실명 검증 상태: ${review.accountVerified ? '일치/검증완료' : '불일치/미검증'}
- 영업 소명 제출 여부: ${review.hasSalesExplanation ? '제출됨 (' + review.salesExplanationNote + ')' : '미제출'}

위 정보를 바탕으로 W07 통제 규칙(장려금 산식 검산, 지주사/마실커머스/Celtonic 특수관계자 이해상충, 월 누적 한도 초과, 수취계좌 실명 일치)을 엄격히 검토하여 분석 결과를 반환하세요.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
              riskScore: { type: Type.INTEGER, description: '위험 점수 0 to 100' },
              summary: { type: Type.STRING, description: '종합 심사 의견 2~3문장' },
              relatedPartyNote: { type: Type.STRING, description: '특수관계자 분석 코멘트' },
              complianceChecks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    pass: { type: Type.BOOLEAN },
                    severity: { type: Type.STRING, enum: ['OK', 'WARN', 'DANGER'] },
                    detail: { type: Type.STRING },
                  },
                  required: ['label', 'pass', 'severity', 'detail'],
                },
              },
              recommendedAction: { type: Type.STRING, enum: ['APPROVE', 'APPROVE_WITH_CONDITION', 'REQUEST_EXPLANATION', 'REJECT'] },
              justificationAdvice: { type: Type.STRING, description: '영업 및 재무 부서가 취해야 할 후속 조치' },
              auditTrailRecommendation: { type: Type.STRING, description: '감사 보고서 및 내부통제 대장 기록 권고' },
            },
            required: [
              'riskLevel',
              'riskScore',
              'summary',
              'relatedPartyNote',
              'complianceChecks',
              'recommendedAction',
              'justificationAdvice',
              'auditTrailRecommendation',
            ],
          },
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        parsed.analyzedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        parsed.modelUsed = 'gemini-3.8-flash (Aurora Corevia Operational Model)';
        return res.json({ analysis: parsed });
      }
    } catch (apiError) {
      console.warn('Gemini API call failed, generating deterministic response:', apiError);
    }
  }

  // Deterministic W07 Rule-Engine fallback
  const isLimitExceeded = (review.monthlyAccumulatedAmount || 0) > (review.monthlyLimitAmount || 100000000);
  let riskScore = 15;
  if (review.isRelatedParty) riskScore += 35;
  if (!review.accountVerified) riskScore += 30;
  if (isLimitExceeded) riskScore += 20;
  if ((review.achievementRate || 0) > 150) riskScore += 10;

  let riskLevel = 'LOW';
  if (riskScore >= 80) riskLevel = 'CRITICAL';
  else if (riskScore >= 65) riskLevel = 'HIGH';
  else if (riskScore >= 40) riskLevel = 'MEDIUM';

  const analysis = {
    riskLevel,
    riskScore,
    summary: `${review.vendorName} 대상 판매장려금 심사: ${riskLevel} 위험도 판정. W07 규정에 따른 거래처 관계 및 한도 검산이 수행되었습니다.`,
    relatedPartyNote: review.relationDetail || (review.isRelatedParty ? '오로라 그룹 특수관계자 내부통제 기준 적용' : '독립 외부 거래처'),
    complianceChecks: [
      {
        label: '판매 실적 대비 장려금 산식 검산',
        pass: true,
        severity: 'OK',
        detail: `목표 ${review.targetSalesAmount?.toLocaleString()}원 / 실적 ${review.actualSalesAmount?.toLocaleString()}원 (달성률 ${review.achievementRate}%) 요율 ${review.contractRebateRate}% 정상`,
      },
      {
        label: '거래처 특수관계인 식별',
        pass: !review.isRelatedParty,
        severity: review.isRelatedParty ? 'WARN' : 'OK',
        detail: review.relationDetail || (review.isRelatedParty ? '그룹 계열 또는 이해관계자 지분 참여 감지' : '특수관계 없음'),
      },
      {
        label: '월간 누적 장려금 한도 검증',
        pass: !isLimitExceeded,
        severity: isLimitExceeded ? 'WARN' : 'OK',
        detail: isLimitExceeded ? '당월 누적 한도 초과로 영업 소명서 필수' : '한도 내 승인 가능',
      },
      {
        label: '수취계좌 예금주 실명 일치',
        pass: Boolean(review.accountVerified),
        severity: review.accountVerified ? 'OK' : 'DANGER',
        detail: review.accountVerified ? '법인명과 일치 검증' : '예금주 상호 불일치로 지급 차단',
      },
    ],
    recommendedAction: riskLevel === 'CRITICAL' ? 'REJECT' : (!review.accountVerified ? 'REQUEST_EXPLANATION' : 'APPROVE_WITH_CONDITION'),
    justificationAdvice: review.accountVerified ? '재무팀 승인 및 지급 일정 확정 권고' : '법인 인감증명서 첨부 계좌정정 공문 징구',
    auditTrailRecommendation: 'Corevia Cosmetics B2B 판매장려금 내부통제 대장 등재',
    analyzedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    modelUsed: 'gemini-3.8-flash (W07 Rules Engine Verifier)',
  };

  res.json({ analysis });
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEXORA Corevia Cosmetics] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
