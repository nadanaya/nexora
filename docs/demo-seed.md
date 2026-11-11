# W07 DEMO 초기 데이터

기존 AXHub 앱과 PostgreSQL을 재사용한다. `nx_state`의 `lounge` 운영 행은 읽기만 하고, `lounge-showcase-v1` 행에 합성 업무를 저장한다. 기존 운영의 후속 작업 1건을 삭제·완료 처리하거나 시연 4건과 혼합 집계하지 않는다. 화면의 **DEMO 보기 / 기존 운영 보기**로 집계를 구분한다.

## 초기화와 출처

- 로그인한 앱 관리자: `POST /api/engine/showcase/seed` (FastAPI `/api/v1/showcase/seed`). 추가 키·인증 설정 없음.
- 원본 거래처·장려금·입금의 참조 스냅샷을 만들고, 기존 규칙 엔진의 `create_case`, `operate`, `task`로 합성 심사와 작업을 만든다. 실제 운영 심사를 예약하거나 원본 CSV를 변경하지 않는다.
- 자료의 금액은 원본에서 계산한다. 심사·증빙·초기 역할은 `DEMO` / `synthetic`이며 실제 거래처의 신규 청구·확인·사람 승인으로 해석하지 않는다. `original_reference`에는 원본 거래처·장려금 ID를 기록한다.
- 초기 상태: `PENDING_SUPPORT` 2건, `DRAFT` 1건, `ON_HOLD` 1건, `REASSESSMENT_REQUIRED` 1건. 영업 작업 2건, 재무 작업 1건, 내부감시 작업 1건, 모두 연결 심사 존재. Seed는 승인·지급 기록을 생성하지 않는다.
- 고정 버전 `w07-showcase-v1`과 PostgreSQL 행 잠금으로 동시·반복 실행을 직렬화한다. 이미 생성했으면 레코드나 처리 상태를 복원하지 않고 현재 결과를 반환한다. 운영 데이터를 덮어쓰는 reset 기능은 제공하지 않는다.

## 조회와 처리

`GET /api/engine/showcase/workspace`의 `workflow_counts.active_cases`와 `open_tasks`를 카드에 표시한다. 진행 심사는 `SIMULATED_PAID`, `REJECTED`, `SUPERSEDED`를 제외하며, 후속 작업은 `OPEN`만 센다. 따라서 승인만 끝난 심사는 지급 대기 중으로 계속 집계되고, 지급·거절·작업 완료에 따라 값이 변한다. 5/4는 최초 Seed의 검증값이며 이후 값을 강제로 유지하지 않는다.

업무 API는 기존 `/api/engine/` 경로 앞에 `showcase/`를 붙인다: `cases`, `cases/{id}/actions`, `cases/{id}/analysis`, `cases/{id}/explanation`, `relationships/change`, `rebates/{id}/correct`, `tasks/{id}/resolve`. 같은 상태 머신을 호출하며 실제 운영 구성원의 역할을 조회한다. 관리자 권한만으로 승인·지급할 수 없고, 기안자 본인 승인·미검증 수취계좌·무승인 지급을 허용하지 않는다. DEMO 증빙과 정정은 합성 자료로만 제출할 수 있다.

AI 미연결은 명시적으로 표시한다. 외부 모델 호출과 규칙 기반 설명은 구분하며, 금액·승인 권한은 기존 규칙 엔진이 결정한다.

## 재현

1. 기존 앱 로그인 → DEMO 보기 → 관리자의 DEMO 초기 데이터 생성.
2. 심사 5건·열린 작업 4건, 출처 배지와 카드 클릭 후 목록 확인.
3. Seed 재확인 → ID·건수 동일. 진행한 업무의 상태는 되돌아가지 않아야 한다.
4. 기존 운영 보기 → 원본 50개/장려금 240건/232,865,386원과 기존 업무 보존 확인.
5. 자동 검증: `python scripts/test-postgres.py`, `node --test tests/request-origin.test.mjs`, `npm run lint`, `node node_modules/typescript/bin/tsc --noEmit`, `npm run build -- --webpack`.
6. 읽기 전용 DB 확인: `scripts/verify-showcase.sql`. 운영 원본 행의 버전·전체 JSON 지문을 Seed 전후 비교한다.

자동 승인·지급 시나리오는 격리된 테스트 PostgreSQL에서 합성 계정으로 실행한다. 운영 DEMO를 처리해 초기 5/4를 소모하거나 실제 사람 승인으로 주장하지 않는다. 기존 Guided Demo의 A/B/C는 별도 계정별 영역에서 반복할 수 있다.
