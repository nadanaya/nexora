# 기존 NEXORA 앱 재배포 결과

2026-11-10 운영 배포 성공. lounge 테넌트의 기존 앱을 재사용했습니다.

- 접속: https://nexora-n28m.axhub.app
- 앱: `8580d873-165a-4f13-ba8e-ffc68368a229`
- 배포: `79126839-65b0-4e2f-a30a-aab8d561c650`
- 코드: `8b0e286c2b465bc37a66d80afef62cd108d43a44`
- 공식 CLI의 해당 배포 검증: `succeeded`, `terminal: true`, `production_live: true`, `environment: production`.
- 별도 HTTPS HEAD: 2026-11-10 13:01:58 UTC, HTTP 200.

기존 저장소 push로 자동 배포했습니다. 새 앱 생성과 `axhub up`은 사용하지 않았습니다. 원본 CSV와 기존 운영 데이터를 보존했으며, 업무 시연은 별도 합성 PostgreSQL에서 수행했습니다.

외부 AI 자격 증명은 로컬·운영 모두 없어 실제 모델 호출은 미검증입니다. 배포 성공이 AI 호출 성공을 뜻하지 않습니다. [설정 안내](AI_SETUP.md)를 참고하세요.

이 결과 문서와 deployment.json은 배포 완료 후 생성한 증거입니다. 위 코드 커밋에 포함된 파일로 주장하지 않습니다. [검증 결과](evidence/deployment.json)
