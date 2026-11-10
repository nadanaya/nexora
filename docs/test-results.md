# 실행한 검증과 미검증
이번 코드 변경 후 실행: 2026-11-10T13:23:06Z, 격리 PostgreSQL, Python28통과·1skip(11.42초). 1skip은 외부 AI 자격 증명 부재. Node 출처 검사2건도 재실행 통과. AI 신규 필드를 포함한 모의 응답 검증을 확인했다. TypeScript·ESLint·디자인 검사·Next 운영 빌드는 이전 코드에서 통과했으며 이번 검증 기록과 구분한다.
구조화 AI 모의 오류6종, 실제 PostgreSQL 승인·거절·취소·재심사·수취계좌 증빙·동시 지급·취소 경합·원자성·감사 불변성 포함. 실제 브라우저 A/B/C 실행. 최초 실패와 수정·재현법은 [최종 검증표](../submission/FINAL_VALIDATION.md).
실행 기록: ../submission/evidence/tests-latest.json, 타임스탬프별 XML/log, origin-tests.log, api-demo.json, browser-verification.json.
재실행: python scripts/test-postgres.py / node --test tests/request-origin.test.mjs / node node_modules/typescript/bin/tsc --noEmit / npm run lint / npm run build -- --webpack.
원본 SHA256 보존 확인. 기존 앱 운영 배포 succeeded·production_live, HTTPS200은 ../submission/evidence/deployment.json.
미검증: 외부 모델 실호출·전체 AI 성공 흐름, 임의 시점 그래프, 전체 앱 Compose, 대규모 부하. 재시작 보존은 동일 임시 PG를 재개한 브라우저 스냅샷으로 관측했으며 운영 장애 복구 부하시험은 아니다.
