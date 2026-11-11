# 실행한 검증과 미검증
최종 화면 빌드(Next webpack·TypeScript), 린트, 디자인 토큰 검사 통과. 격리 HTTP 게이트웨이로 새 Guided A/B/C를 실행하고 운영 작업 공간 전체 응답의 전후 동일성을 확인했다(guided-api.json). 실제 로컬 브라우저 B는8/8단계와 최종 승인 완료를 확인했다(guided-local-browser.txt). 반응형 뷰포트1440/768/390px에서 문서 폭1425/753/375px로 가로 넘침이 없었다. 실제 모바일 기기를 시험한 것은 아니다. 화면 증거는 guided-replay-full.png·guided-mobile.png.

최신 실행: **2026-11-11 12:20:47 KST** 시작, PostgreSQL35통과·외부 AI1skip(23.03초). 증거 tests-20261111T032047Z.xml/log. 새 Guided A/B/C·사용자 분리·중복 클릭·재접속·내부감시 조사 완료와 승인 금지·규칙 기반 설명 보호 포함. Node 출처 검사2통과. 최종 린트·디자인 규칙 통과. 최종 빌드 결과와 브라우저·배포 증거는 아래 후속 보고로 연결한다.

최초 새 B 검사는 재기안자 본인 승인 차단으로1실패·33통과·1skip이었다(tests-20261110T155414Z). 모의 기안자·승인자를 분리한 뒤34통과, 최종 동시성 검사 추가 후35통과했다. Windows 검사 프로그램 시작 오류는 권한 있는 기존 설치 도구로 재실행해 복구했다. CUA 공식 제출 페이지 탐색은 시간 초과로 문항 제한을 확인하지 못했다.

다음은 이전 버전의 검증 기록이며 최신 결과와 구분한다.
이번 코드 변경 후 실행: 2026-11-10T13:23:06Z, 격리 PostgreSQL, Python28통과·1skip(11.42초). 1skip은 외부 AI 자격 증명 부재. Node 출처 검사2건도 재실행 통과. AI 신규 필드를 포함한 모의 응답 검증을 확인했다. TypeScript·ESLint·디자인 검사·Next 운영 빌드는 이전 코드에서 통과했으며 이번 검증 기록과 구분한다.
구조화 AI 모의 오류6종, 실제 PostgreSQL 승인·거절·취소·재심사·수취계좌 증빙·동시 지급·취소 경합·원자성·감사 불변성 포함. 실제 브라우저 A/B/C 실행. 최초 실패와 수정·재현법은 [최종 검증표](../submission/FINAL_VALIDATION.md).
실행 기록: ../submission/evidence/tests-latest.json, 타임스탬프별 XML/log, origin-tests.log, api-demo.json, browser-verification.json.
재실행: python scripts/test-postgres.py / node --test tests/request-origin.test.mjs / node node_modules/typescript/bin/tsc --noEmit / npm run lint / npm run build -- --webpack.
원본 SHA256 보존 확인. 기존 앱 운영 배포 succeeded·production_live, HTTPS200은 ../submission/evidence/deployment.json.
미검증: 외부 모델 실호출·전체 AI 성공 흐름, 임의 시점 그래프, 전체 앱 Compose, 대규모 부하. 재시작 보존은 동일 임시 PG를 재개한 브라우저 스냅샷으로 관측했으며 운영 장애 복구 부하시험은 아니다.
