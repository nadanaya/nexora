# NEXORA · W07

## 최신 업무 화면

기존 앱 [NEXORA](https://nexora-n28m.axhub.app)를 유지합니다. 거래처 관계·합산·AI 판단·승인·모의 지급·부서 작업·Decision Replay·감사 추적을 메뉴에서 엽니다. [Guided Demo](https://nexora-n28m.axhub.app/workspace/demo)는 로그인 계정별 격리된 합성 실행으로 A/B/C를 단계별 처리하며 운영 원본을 초기화하지 않습니다. 새 코드는 배포 검증 결과와 함께 확인하세요.

외부 모델 자격 증명이 없어도 **규칙 기반 근거 설명**을 사용할 수 있습니다. 이는 생성형 AI 결과가 아니며 화면과 감사 기록에서 구분합니다. 내부감시팀은 조사 결과를 저장하지만 지급 승인 권한은 없습니다. 모의 지급 성공 시 재무 후속 작업도 완료됩니다.

[구현 상태 감사](docs/implementation-audit.md) · [제출용 시연 대본](docs/demo-script.md) · [실행한 검사](docs/test-results.md)

## 마스터 프롬프트 대응 문서

전체 앱 로컬 실행 설정은 [docker-compose.full.yml](docker-compose.full.yml), 설정·인증·미검증 범위는 [로컬 실행 안내](docs/local-compose.md). Docker가 없는 현재 PC에서는 컨테이너 실행을 검증하지 않았습니다.

[요구사항·공식 자료와 차이](docs/requirements.md), [현재 아키텍처·DB·API](docs/architecture.md), [데이터 계보](docs/data-lineage.md), [결정 규칙](docs/decision-rules.md), [가정·제약](docs/assumptions.md), [시연](docs/demo-scenarios.md), [검증 결과](docs/test-results.md), [문항별 1,000자 이내 초안](docs/submission-answers.md).

## 제출 전 검증 자료

[최종 검증표](submission/FINAL_VALIDATION.md) · [시연 순서](submission/DEMO_GUIDE.md) · [A04 설명 초안](submission/A04_DRAFT.md) · [AI 실제 연결 설정](submission/AI_SETUP.md). 실제 브라우저·HTTP·PostgreSQL 증거는 `submission/evidence`에 보관합니다. 외부 AI 자격 증명이 없으므로 실제 모델 연동 성공으로 표시하지 않습니다.

React·TypeScript·Tailwind 화면과 FastAPI·NetworkX·PostgreSQL 업무 서버를 연결한 판매장려금 운영 앱입니다. 관계 판정, 월 합산, 증빙 보류, 사람 승인, 승인 취소·거절·재심사, 관계 변경 영향, 영업 작업·재무 일정, 모의 지급과 감사 이력을 구현합니다. 실제 은행 이체는 없습니다.

## 구조와 실행

- 화면: 기존 Next.js/React 셸. 업무 API는 `/api/engine/*`에서 서명해 내부 FastAPI로 전달합니다.
- 업무: `backend/main.py`, `backend/domain.py`. FastAPI는 컨테이너 내부 127.0.0.1:8000에서만 열립니다.
- 저장: PostgreSQL `nx_state`의 버전 있는 업무 묶음과 `nx_audit`, `nx_payment_items`. W07 규모에 맞춰 단일 테넌트 잠금으로 관계 변경과 지급을 함께 직렬화합니다. 기존 w07_* 테이블은 보존합니다.
- 구버전 지급 처리 API는 종료했습니다. 신규 운영 승인으로 과거 승인 이력을 자동 승격하지 않습니다.
- Docker는 Python과 Node를 함께 실행하고 어느 한쪽이 종료되면 전체 컨테이너가 종료됩니다. 상태 확인은 FastAPI와 DB까지 확인합니다.

배포 시 PostgreSQL 연결은 AXHub가 제공합니다. `NEXORA_MATCH_KEY`는 비밀 설정으로 유지해야 합니다. 이 값을 바꾸면 기존 비교값을 해석할 수 없어 시작을 차단합니다. 내부 요청 서명키는 시작 시 생성하여 두 프로세스만 공유합니다.

개발 환경은 Python 3.12, Node.js 20.19 이상, PostgreSQL을 사용합니다. `pip install -r backend/requirements.txt`, `npm ci`로 준비합니다. 화면 개발은 `npm run dev`, 서버 개발은 환경에 DATABASE_URL·NEXORA_MATCH_KEY·NEXORA_INTERNAL_SECRET을 지정한 뒤 `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000`으로 실행합니다. 두 프로세스의 비밀 설정은 같아야 합니다. 운영 실행은 Dockerfile을 사용합니다.

## 원본과 보완 자료

`scripts/prepare-bootstrap.py`는 프로젝트 상위의 원본 CSV 3종을 UTF-8 파이프로 읽어 개인정보를 최소화한 `backend/bootstrap.json`을 만듭니다. 원본 파일은 수정하지 않습니다. 대표자·주소·등록계좌 원문 대신 HMAC 비교값을 저장하며 파일 SHA-256과 행 번호를 남깁니다. 전체 지급 수취계좌와 예금주도 저장하지 않고 비교값·계좌 끝 4자리·검토 근거를 보관합니다. 이 앱은 모의 지급 전용입니다.

운영 시작 시 새 엔진이 비어 있을 때만 원본 연결 자료를 한 번 불러옵니다. 기존 데이터와 운영 이력은 덮어쓰지 않습니다. 초기화용 삭제 API는 제공하지 않습니다. 과거 지급일이 있는 196건은 신규 지급 대상에서 제외합니다. 원본 반려 건 역시 신규 기안에 포함하지 않습니다.

원본 사실·계산 결과·가정·합성 회신·실제 확인 회신을 구분합니다. 지급 수취계좌를 원본 입금계좌에서 추정하지 않습니다. 합성 증빙을 사용한 지급 영수증도 실제 성과가 아닌 모의 결과입니다.

## 역할과 실제 사용

앱 관리자가 관리 화면에서 본인 또는 회사의 가입한 활성 구성원에게 업무 역할을 지정합니다. 관리자 권한만으로 승인할 수 없습니다. 역할은 영업지원팀·영업임원·영업팀·재무팀·조회전용입니다. 구성원 목록은 AXHub 회사 앱 주소에서 사용할 수 있으며 개인 공개 주소에서는 목록 조회가 제한될 수 있습니다.

1. 영업지원팀이 거래처와 월을 지정해 관련자 그룹의 미지급 심사를 기안합니다.
2. 증빙 없이 상신하면 보류되고 영업 보완 작업이 생성됩니다.
3. 영업팀이 정산·관계 소명·지급 대상별 계좌 증빙을 제출하고, 다른 영업지원 담당자가 검토합니다.
4. 기안자와 다른 영업지원 담당자가 승인합니다. 월 그룹 합계 200만 원 초과는 영업임원이 추가 승인합니다.
5. 재무팀이 영업일 지급 일정을 반영한 후 모의 지급합니다. 같은 항목은 다시 지급할 수 없습니다.
6. 승인 취소·금액·계좌·관계 변경은 기존 승인을 무효화하고 일정을 중지합니다. 관계 합병·분리 시 대체 심사를 생성합니다. 이미 지급한 건은 되돌리지 않고 사후 검토 작업을 만듭니다.

화면의 관계 정정은 가상 기준일 2026-07-01의 정정만 지원합니다. 미래 적용 예약과 임의 시점 과거 그래프 조회는 아직 구현하지 않았습니다. 금액 정정은 API `/api/v1/rebates/{id}/correct`로 구현했으며 전용 화면은 아직 없습니다.

## API와 AI

실제 API 계약은 `backend/openapi.json`에 있습니다. 상세 초기 설계와 비교하여 현재 구현은 정규화 테이블 다수 대신 JSONB 업무 묶음을 사용하며, 미구현 API를 제공하는 것처럼 표시하지 않습니다.

AI 설명 어댑터는 LLM_API_KEY·LLM_BASE_URL·LLM_MODEL을 설정하면 OpenAI 호환 Chat Completions 공급자를 호출합니다. 구조화 스키마와 근거 식별자를 검증합니다. AI 출력으로 승인·지급 상태를 바꾸지 않습니다. 공급자 설정이 없으면 미설정 오류를 표시합니다. 실제 모델 호출은 공급자 자격 증명이 준비돼야 검증할 수 있습니다. 설정값과 키는 Git에 넣지 않습니다.

## 테스트와 확인된 한계

`python scripts/test-postgres.py`는 설치된 PostgreSQL 바이너리로 임시 서버를 만들고 종료합니다. Windows 기본 경로는 PostgreSQL 18이며 PG_BIN으로 바꿀 수 있습니다. 기존 서버는 건드리지 않습니다. 임시 폴더는 OS 임시 경로에 남습니다. 일반 환경은 별도 테스트 DB에 DATABASE_URL을 지정하고 `python -m pytest backend/tests -q -p no:cacheprovider`를 실행하세요.

정상·한도 경계·전이 관계·증빙 부족·거절·재상신·취소·관계 분리·금액 정정·동시 지급·멱등 재시도·거래 롤백·감사 변경 금지·접근 제한·AI 미설정 보호를 검증합니다. 원본 파일 해시 보존과 232,865,386원 검산을 자동 확인합니다. 실제 은행 대사·현금잔액 확인·외부 통지 전송은 구현하지 않았습니다.

화면 확인: `node node_modules/typescript/bin/tsc --noEmit`, `npm run lint`, `bash scripts/check-design.sh`, `npm run build -- --webpack`.

배포는 AXHub 공식 플러그인과 lounge의 기존 NEXORA 저장소를 사용합니다. `axhub up`은 사용하지 않습니다. 보호 설정과 비밀 파일은 커밋하지 않습니다.
