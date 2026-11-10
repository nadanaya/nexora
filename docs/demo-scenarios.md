# 재현 가능한 시연
상세 실행 순서와 합성 입력은 [시연 안내](../submission/DEMO_GUIDE.md).
운영 원본을 초기화하지 않는다. python scripts/demo-server.py는 OS 임시 PostgreSQL에 합성 자료만 적재하고 실제 Next·FastAPI 경로를 실행한다. python scripts/demo-api.py all로 HTTP A/B/C를 실행한다.
A: 200만원 → 증빙 제출/다른 사용자 검토 → 상신 → 별도 영업지원 승인 → 재무 일정 → 모의 지급 → 중복 차단·감사 확인. AI는 미설정 오류가 실제 관측 결과이며 생성 성공 시연이 아니다. >200만원 임원 권한 경계는 별도 API 테스트로 검증했다.
B: 합성240만원 그룹 → 승인·일정 → 관계 정정 미리보기·적용 → 그룹 분리 → 기존 심사 대체·일정 중지 →90만원 재심사. 합병·기지급 사후검토는 회귀 테스트로 검증.
C: 증빙 없음 → 보류·영업 작업 → 합성 회신·검토·작업 완료 → 재상신 → 별도 승인자 거절 → 거절 및 후속 작업.
브라우저 실행 증거는 ../submission/evidence/browser-*.png 및 browser-verification.json. 종료는 python scripts/demo-api.py stop. 합성 역할 전환은 로컬 실행기에만 있으며 운영 인증 우회 기능이 아니다.
