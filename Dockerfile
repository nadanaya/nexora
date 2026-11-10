# axhub 배포용 — Next.js (next.config.ts 의 output:"standalone") 를 빌드해 node 로 서빙.
# standalone 은 자체 server.js + 최소 node_modules 를 .next/standalone 에 담아요.
# (public/ 은 이 템플릿에 없어 생략 — 추가하면 `COPY --from=build /app/public ./public` 줄을 더하세요.)
# Node 메이저(20)는 Newt 앱 개발 샌드박스(app-development runner profile)와 맞춰요 — 바꾸면 둘 다 바꿔요.
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
# package-lock.json 이 있으면 npm ci 로 잠긴 버전을 그대로 설치해요(잠금과 package.json 이 어긋나면 실패).
# 없으면 예전처럼 npm install 로 설치해요.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build              # output:"standalone" → .next/standalone

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV PYTHONDONTWRITEBYTECODE=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY backend /app/backend
EXPOSE 3000
CMD ["python", "-m", "backend.launch"]
