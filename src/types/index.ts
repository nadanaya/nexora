export type CorporateEntityId = 'aurora-holdings' | 'corevia-cosmetics' | 'masil-commerce' | 'celtonic-labs';

export interface CorporateEntity {
  id: CorporateEntityId;
  name: string;
  nameEn: string;
  role: string;
  description: string;
  tag: string;
  color: string;
  isW07Target?: boolean;
}

export type ReviewStatus =
  | 'PENDING_APPROVAL'  // 승인 대기
  | 'DOC_VERIFICATION'  // 증빙 확인
  | 'RE_EXAMINATION'    // 재심사
  | 'ON_HOLD'           // 보류
  | 'APPROVED'          // 승인 완료
  | 'REJECTED'          // 반려/거절
  | 'PAID';             // 모의 지급 완료

export type DataSourceType = 'DEMO' | 'SIMULATED' | 'W07_ACTUAL';

export interface Vendor {
  id: string;
  code: string;
  name: string;
  category: 'H&B 총판' | '드럭스토어 벤더' | '병의원 더마 클리닉' | '글로벌 면세 총판' | '온라인 전문 유통';
  representative: string;
  businessNumber: string;
  relationType: '일반 거래처' | '지주사 계열 관계' | '대표자 친인척 특수관계' | '마실커머스 교차지배' | '인수 추진사 협력';
  isRelatedParty: boolean;
  shareholdingPct?: number;
  registeredBankAccount: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
    isVerified: boolean;
  };
  productLines: string[];
}

export interface ApprovalHistoryItem {
  timestamp: string;
  actorName: string;
  actorRole: 'SALES' | 'FINANCE' | 'AUDIT';
  action: string;
  note: string;
}

export interface ComplianceCheckItem {
  label: string;
  pass: boolean;
  severity: 'OK' | 'WARN' | 'DANGER';
  detail: string;
}

export interface AIAnalysisResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0 - 100
  summary: string;
  relatedPartyNote: string;
  complianceChecks: ComplianceCheckItem[];
  recommendedAction: 'APPROVE' | 'APPROVE_WITH_CONDITION' | 'REQUEST_EXPLANATION' | 'REJECT';
  justificationAdvice: string;
  auditTrailRecommendation: string;
  analyzedAt: string;
  modelUsed: string;
}

export interface RebateReview {
  id: string;
  code: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  productLine: string;
  targetQuarter: string;
  targetSalesAmount: number;     // 목표 매출액 (KRW)
  actualSalesAmount: number;     // 실제 달성 매출액 (KRW)
  achievementRate: number;       // 달성률 (%)
  contractRebateRate: number;    // 계약 장려금율 (%)
  calculatedRebateAmount: number;// 산출 판매장려금액 (KRW)
  monthlyAccumulatedAmount: number; // 당월 누적 지급액
  monthlyLimitAmount: number;       // 당월 한도액 (W07 기준)
  status: ReviewStatus;
  dataSource: DataSourceType;
  requestedDate: string;
  requestedBy: string;
  hasSalesExplanation: boolean;
  salesExplanationNote?: string;
  financeScheduleDate?: string;
  paymentTransactionId?: string;
  paidAt?: string;
  rejectionReason?: string;
  approvalHistory: ApprovalHistoryItem[];
  aiAnalysis?: AIAnalysisResult;
  isRelatedParty: boolean;
  relationDetail?: string;
  accountVerified: boolean;
}

export type FollowUpType = 
  | 'SALES_EXPLANATION'       // 영업 소명
  | 'FINANCE_SCHEDULE'        // 재무 일정
  | 'BANK_DOC_VERIFICATION'   // 계좌 증빙 확인
  | 'AUDIT_COMMITTEE_REPORT'; // 감사위원회 사전보고

export interface FollowUpTask {
  id: string;
  reviewId?: string;
  reviewCode?: string;
  vendorName: string;
  type: FollowUpType;
  title: string;
  description: string;
  assigneeRole: 'SALES' | 'FINANCE' | 'AUDIT';
  assigneeName: string;
  dueDate: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM';
  status: 'OPEN' | 'RESOLVED';
  submissionNote?: string;
  resolvedAt?: string;
  dataSource: DataSourceType;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: 'SALES' | 'FINANCE' | 'AUDIT';
  action: string;
  reviewCode?: string;
  vendorName?: string;
  details: string;
  prevStatus?: string;
  nextStatus?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'SALES' | 'FINANCE' | 'AUDIT';
  department: string;
  title: string;
  avatarColor: string;
  canInitiate: boolean;
  canApprove: boolean;
  canAudit: boolean;
  canDisburse: boolean;
}

export interface SodAlertData {
  isOpen: boolean;
  attemptedAction: string;
  reviewCode?: string;
  vendorName?: string;
  customMessage?: string;
}

