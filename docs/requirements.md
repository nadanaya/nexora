# 요구사항과 공식 근거
확인일 2026-11-10. 기존 구현을 보존하고 첨부 마스터 프롬프트와 비교했다.

## 우선 자료
루트 README의 원본·기록 키 보호, 제공 README와 설치 안내, 세계관_BPMN/W07.html, A01.html, A04.html(v1.5), A05.html, 04_원본데이터/README.md 및 00_common/approval_authority_policy.md를 기준으로 한다. 초기 분석은 ../../NEXORA_IMPLEMENTATION_PLAN.md, 현재 증거는 ../submission/FINAL_VALIDATION.md다.

## 확정 규칙
대표자·주소·등록 정산계좌 중 결측을 제외한 두 필드 이상 일치하면 직접 간선, NetworkX 연결요소로 전이 그룹. 200만원 이하는 영업지원 전결, 초과는 영업임원 승인. 모든 장려금은 영업지원 절차 경유. 입금 관측은 지급 수취계좌 증빙을 대신하지 않는다. 자료는 UTF-8 파이프, 원·VAT 제외, 가상 기준일 2026-07-01.

## 실제 데이터 검산
거래처50, 장려금240건(2026-01~06), 총232,865,386원, 입금32건. 직접 간선 D-011↔D-024(대표자·주소), D-011↔D-037(대표자·정산계좌). D-024↔D-037은 직접 간선이 없다. 관련자3개 그룹과 단독47개, 전체48그룹. 해당 그룹 6월 합계3,888,097원. 원본 검산 테스트와 파일 해시는 ../submission/evidence/source-preservation.json 참조.

## 프롬프트와 현재 구현의 차이
공식 승인 권한을 예시 역할보다 우선했다. 상태는 PENDING_SUPPORT·PENDING_EXECUTIVE·SIMULATED_PAID 등 실제 API 이름을 사용한다. UI는 기존 HeroUI·Phosphor 및 자체 SVG이며 TanStack Query·React Flow·Recharts·Lucide 미사용. DB는 psycopg·SQL 마이그레이션이며 SQLAlchemy·Alembic 미사용. 계층 역할은 구현돼 있으나 요청한 개별 디렉터리 구조로 분리되지 않았다.
정규화는 NFC·앞뒤 공백 제거만 지원한다. 대소문자·내부 공백·계좌 구두점 통합은 현재 미지원이며 원본 매칭 기준 변경 없이 추가 설계 대상으로 둔다.
AI는 기존 상세 필드를 유지하며 evidence·risk_level·missing_information·recommended_action·decision_context·recommendation·alternatives·affected_departments·assumptions 필드를 제공한다. Pydantic으로 필수 필드와 위험 수준을 검증하고 evidence의 근거 키도 검사한다. 외부 모델 호출은 자격 증명 부재로 미검증이며 별도 규칙 기반 설명 API를 제공한다.
AGENTS.md는 이미 존재하며 보호 지시에 따라 변경하지 않았다. 실제 제출 화면 문항·글자 수는 로그인된 제출 화면에서 미확인이다. A04 문항 기반 초안과 사용자 요청의 1,000자 제한을 적용한다.

## 수용 결과
핵심 승인·지급·재심사·부서 작업·동시성·감사와 A/B/C는 실제 검증. 외부 AI 전체 흐름, 임의 적용일 그래프, 금액 정정 전용 UI, 전체 앱 Docker Compose 실행은 미완료. 상세 상태는 test-results.md와 architecture.md에 구분한다.
