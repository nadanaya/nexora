# 데이터 계보
SOURCE: 제공 파일 원본(가상 세계관의 제공 사실). DERIVED: 그래프·월합계·승인 필요 여부·변경 영향. ASSUMPTION: 참가자 추가 통제·기준. SYNTHETIC: 별도 로컬 DB의 시연 거래처·역할·회신.
현재 코드의 source_kind 문자열은 original/derived/assumption/synthetic 등이다. 네 대문자 이름은 문서상 개념 분류이며 저장값을 바꿨다고 주장하지 않는다.

마스터: m_agency_cv.csv → representative_name/address/bank_account_no → 비밀 키 HMAC 비교 → 직접 간선 → 연결요소.
장려금: sales_rebate_payment_cv.csv → 거래처·정산 월 → 관련 그룹 합계·심사 항목.
입금: fin_collection_history_cv.csv → 등록 계좌와의 불일치 관측. 관계 필드와 실제 지급 수취계좌를 대체하지 않는다.

수집 시 CSV UTF-8·delimiter='|' 명시. 파일 해시·행 참조·규칙 버전으로 근거를 추적한다. 원본 지급 상태와 새 운영 승인 상태를 분리한다. 원본 과거 지급은 신규 재지급에서 제외한다.
현재 마스터로 과거 월을 재검산한 결과는 당시 관계의 확정 증거가 아니다. 당시 마스터·임원 승인서·은행 수취계좌 증거가 없으므로 확인 작업과 보류를 사용한다.
보존 검증: ../submission/evidence/source-preservation.json. 합성 DB 결과: ../submission/evidence/browser-api-snapshot.json. 상세 데이터 정의·한계: ../submission/A04_DRAFT.md.
