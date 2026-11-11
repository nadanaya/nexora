# 현재 아키텍처와 API
React19·TypeScript·Tailwind4 / Next16 → 동일 출처 Next 프록시 → loopback FastAPI → psycopg PostgreSQL. AXHub 식별을 서버에서 검증해 서명된 사용자 문맥을 전달한다. 브라우저 역할 헤더를 신뢰하지 않는다.

## 구현 경계
backend/main.py: API·Pydantic 입력·권한. backend/domain.py: 관계·규칙·상태 머신·작업·감사. backend/analysis.py: 구조화 AI 어댑터. backend/store.py: 저장소·트랜잭션. backend/migrations/001_engine.sql: 재실행 가능한 스키마. backend/tests: 단위·실제 PostgreSQL 통합 검사. 요청한 api/schemas/models/services 등 각각의 폴더는 아직 없다.

## 실제 스키마
Guided Demo는 기존 세 테이블을 그대로 사용하되 실제 테넌트+로그인 사용자 해시+실행 UUID로 별도 저장 키를 도출한다. backend/guided_demo.py의 서버 정의 시나리오만 실행한다. 소유자 분리와 expected_step 검사를 거치며 운영 역할 변경·운영 심사 호출로 연결되지 않는다. 새 시작은 별도 실행을 만들며 예전 감사 행을 삭제하지 않는다. 이것은 애플리케이션 레벨 격리이며 별도의 물리 DB 또는 RLS 구현으로 주장하지 않는다.
nx_state: tenant PK, version bigint, payload jsonb, updated_at timestamptz. payload에 agencies/rebates/deposits/cases/tasks/payments/members/impacts/events/files/graph_revision 저장.
nx_audit: tenant FK, sequence bigint, event_id uuid, event jsonb. PK(tenant,sequence), UNIQUE(tenant,event_id). UPDATE·DELETE 금지 트리거.
nx_payment_items: tenant FK, rebate_id text, receipt_id text, PK(tenant,rebate_id). 원본 항목의 성공 지급 중복 차단.
transaction은 테넌트 행을 FOR UPDATE로 잠그고 규칙 재검증·상태·지급 항목·감사 저장을 함께 커밋한다. 실패는 전체 롤백. 소규모 데이터용이며 대규모 부하 검증은 없다.

## API 명세
현재 전체 계약은 [실제 OpenAPI](../backend/openapi.json). 기안·증빙·검토·상신·승인/거절·취소·재심사·일정·모의 지급·관계 변경 preview/apply·금액 정정·작업 완료·감사 조회를 구현했다. 동작·권한·입력 필드는 해당 계약을 기준으로 한다.
AI 설정 조회와 분석 요청을 별도 제공한다. 설명 실패가 승인·지급 규칙을 변경하지 않는다.

## 배포
기존 lounge 앱과 selfhosted 저장소 사용. Next 공개 PORT, FastAPI loopback 전용. backend/launch.py로 두 프로세스 기동. 기존 Dockerfile·AXHub 설정 유지. docker-compose.dev.yml은 PostgreSQL만 제공한다. docker-compose.full.yml은 전체 앱 설정이며 Docker 미설치로 실행 미검증이다. local-compose.md 참조. 기존 운영 배포 결과는 ../submission/DEPLOYMENT.md이며 이번 추가 코드의 배포 증거와 구분한다.
