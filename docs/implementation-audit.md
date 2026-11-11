# 구현 상태 감사 — 2026-11-11

기준: 현재 코드, 제공 W07·A01·A04·A05·공통 승인 정책, [공식 대회 페이지](https://axacademy.ai/axwar/samilpwc-1). 기존 프로젝트·앱·DB를 유지했다. 공식 자료상 언어·프레임워크는 자유이며 불필요한 라이브러리 재작성은 하지 않았다.

## 기존 기능

- IMPLEMENTED — UTF-8 파이프 CSV 수집·파일 해시·원본 행 계보·정수 원 검산: backend/domain.py import_data/reconcile. 거래처50·장려금240·총232,865,386원 검산 테스트.
- IMPLEMENTED — NetworkX 2/3 직접 일치·결측 제외·전이 그룹, NFC·앞뒤 공백 정규화. 내부 공백·대소문자·계좌 구두점 통합은 미지원. 기존 비교 키를 바꾸지 않았다.
- IMPLEMENTED — 영업지원 경유·200만원 초과 임원 승인, 본인 승인 금지, 증빙 누락 보류, 승인 취소·정보 정정·재심사.
- IMPLEMENTED — FastAPI 서버 권한·서명 인증·테넌트 검증, PostgreSQL JSONB 업무 묶음·행 잠금·감사·성공 지급 유일 제약. SQLAlchemy/Alembic 미사용.
- IMPLEMENTED — 사람 승인 후 재무 일정·모의 지급·멱등성·동시 요청·동일 거래 감사 기록. 실제 은행 송금 없음.
- PARTIALLY_IMPLEMENTED — 외부 LLM 어댑터·구조화 검증·실패 감사는 구현. 실제 자격 증명 부재로 실제 모델 호출 미검증.
- PARTIALLY_IMPLEMENTED — 관계 변경 영향 미리보기·적용은 기존 구현. 명명된 Decision Replay 화면과 운영용 Guided Demo는 기존에 없었다.

## 이번 추가

- IMPLEMENTED — 격리 Guided Demo A/B/C: backend/guided_demo.py. 서명된 실제 로그인 사용자별 별도 nx_state 키로 저장. 시연 단계만 합성 역할을 사용하며 운영 테넌트 키로 처리하지 않는다. 시작은 새 실행 생성, 기존 원본·감사·시연 삭제 없음. 소유자 분리·중복 클릭·재접속 보존 검사.
- IMPLEMENTED — Decision Replay: backend/domain.py apply_change의 같은 실제 경로를 운영·시연에서 사용. 계좌 정정 전120만원/지원 전결/일정 반영 → 후230만원/임원 필요/기존 심사 대체·새 심사. 전후 그룹·금액·권한·상태를 저장하고 components/DecisionReplay.tsx에서 비교.
- IMPLEMENTED — 내부감시팀 역할·관계 변경 조사 작업·결과 저장, 승인 권한 없음. 모의 지급 시 재무 작업 자동 완료와 영수증 참조를 같은 거래에서 저장.
- IMPLEMENTED — 외부 AI 미연결 시 별도 규칙 기반 설명 API. 생성형 AI로 표시하지 않는다. decision_context·recommendation·alternatives 추가. 모델 위험 수준은 설명일 뿐 금액·권한을 변경하지 않는다.
- IMPLEMENTED — 기존 셸을 보존한9개 업무 영역 및 Guided Demo 경로, 현황의 실제 심사 처리 큐, 로딩·오류·빈 상태. 브라우저 확인 결과는 이번 실행 증거를 기준으로 별도 기록한다.

## 실행 상태와 제약

2026-11-11 00:57:36 KST PostgreSQL35건 통과·외부 AI1건 제외. 최초 B 시연은 본인 승인 차단으로 실패했고 합성 기안자와 검토자를 분리해 재검증했다. 테스트 조건은 완화하지 않았다. Windows 검사 프로그램 시작 오류는 권한 있는 기존 도구 실행으로 복구 중이며 빌드·린트 최종 결과는 test-results.md에 기록한다.

최종 실행에서35통과·1skip을 다시 확인했다(2026-11-11 12:20:47 KST). 최종 빌드·린트·디자인 검사 통과, 실제 HTTP A/B/C와 로컬 브라우저 B8/8단계·반응형3폭 확인. Windows 실행 오류는 복구됐다. 배포 결과는 완료 후 별도 검증 증거로 남긴다.

NOT_IMPLEMENTED — 실제 은행/현금 잔액/외부 알림, 임의 과거·미래 관계 시점, 금액 정정 전용 화면. 전체 Compose 설정은 있으나 Docker 미설치로 기동 미검증. 실제 제출 접수·시연 영상 녹화는 수행하지 않았다. 제출 화면의 실제 글자 제한은 확인 전까지 임의로 확정하지 않는다. 원본에 당시 관계·임원 승인서가 없다는 이유로 부정이나 승인 부재를 단정하지 않는다.
