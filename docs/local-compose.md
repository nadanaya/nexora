# 전체 앱 로컬 Compose

docker-compose.full.yml은 기존 Dockerfile로 Next와 FastAPI를 함께 실행하고 PostgreSQL을 연결한다. 기존 docker-compose.dev.yml(DB만)은 유지한다. DB 볼륨은 nexora_full_pg이며 기존 운영 DB와 연결하지 않는다.

## 필요한 설정

Docker Engine와 Compose 플러그인이 필요하다. .env.local의 기존 NEXORA_MATCH_KEY를 유지하고 NEXORA_DB_PASSWORD에 URL 예약 문자가 없는 충분히 긴 난수 암호를 설정한다. 새 비교 키로 기존 bootstrap.json을 시작하면 fingerprint 검사에 의해 차단된다. 비밀 키를 문서·ZIP·Git에 넣지 않는다. 외부 AI는 선택적으로 LLM_API_KEY·LLM_BASE_URL·LLM_MODEL을 서버 설정한다.

```
docker compose --env-file .env.local -f docker-compose.full.yml config --quiet
docker compose --env-file .env.local -f docker-compose.full.yml up --build -d
curl http://127.0.0.1:3000/healthz
docker compose --env-file .env.local -f docker-compose.full.yml down
```

down은 볼륨을 보존한다. -v를 추가하지 않는다. app은 127.0.0.1:3000에만 노출하고 DB 포트는 외부에 열지 않는다. 전체 앱의 인증은 기존 AXHub 식별 경계를 유지하므로 일반 로컬 브라우저의 익명 사용자는 승인 업무를 수행할 수 없다. 합성 역할별 A/B/C는 기존 scripts/demo-server.py를 사용한다. 이 설정에 인증 우회 기능을 넣지 않았다.

## 검증 범위

현재 PC에서 docker 명령을 찾을 수 없어 config·이미지 빌드·컨테이너 기동은 실행하지 못했다. YAML의 구조와 기동 명령·건강 검사 경로를 코드와 대조했다. 실행 완료로 표시하지 않는다. 운영 배포는 이 Compose를 사용하지 않는다.
