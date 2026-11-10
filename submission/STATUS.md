# 제출 전 검증 진행 상태

2026-11-10. 현재 코드와 실행 증거를 우선합니다.

- PostgreSQL 최종 재실행: 28 통과, 외부 AI 실호출 1건은 자격 증명 부재로 차단.
- 출처 검사: 정상 프록시 요청을 막던 문제 수정, Node 회귀 검사 2개 통과.
- API A/B/C: 실제 HTTP·Next·FastAPI·PostgreSQL 경로로 통과. A의 외부 AI는 별도 차단.
- 브라우저 A: 기안·AI 미설정 표시·다른 합성 사용자 승인·모의 지급 완료 확인, browser-A.png.
- 브라우저 B: 240만→90만 원, 기존 심사 대체, 영업지원 승인 대상 재상신 확인, browser-B.png.
- 브라우저 C: 같은 합성 DB 재개 후 보류·회신 검토·영업 작업 완료·재상신·거절 확인. browser-C-hold.png와 browser-C-rejected.png.
- 최종 검증표·시연 순서·A04 초안·AI 설정 문서 작성 완료. 기존 앱 운영 재배포 succeeded·production_live와 HTTPS 200 확인. 상세는 DEPLOYMENT.md와 evidence/deployment.json.
- 로컬·운영에 LLM_API_KEY·LLM_BASE_URL·LLM_MODEL 없음. 비밀 키를 임의 생성하거나 실호출 성공으로 표시하지 않음.
