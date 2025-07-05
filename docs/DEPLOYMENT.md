# 배포 가이드

## 환경별 배포

### 프론트엔드 - Vercel 배포

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **프로젝트 배포**
   ```bash
   cd frontend
   vercel
   ```

3. **환경 변수 설정**
   - Vercel 대시보드에서 환경 변수 설정
   - `NEXT_PUBLIC_API_URL`: 백엔드 API URL
   - `NEXTAUTH_URL`: 프론트엔드 도메인
   - `NEXTAUTH_SECRET`: NextAuth 비밀키

### 백엔드 - Railway 배포

1. **Railway CLI 설치**
   ```bash
   npm install -g @railway/cli
   ```

2. **프로젝트 생성 및 배포**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

3. **환경 변수 설정**
   ```bash
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set JWT_SECRET="your-secret"
   railway variables set NODE_ENV="production"
   ```

4. **데이터베이스 마이그레이션**
   ```bash
   railway run npm run db:push
   railway run npm run db:seed
   ```

### 데이터베이스 - Supabase

1. **Supabase 프로젝트 생성**
   - [Supabase](https://supabase.com) 접속
   - 새 프로젝트 생성
   - PostgreSQL 데이터베이스 URL 복사

2. **연결 설정**
   ```bash
   # backend/.env
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]"
   ```

## Docker 배포

### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/openclass
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=openclass
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## CI/CD 설정

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd backend && railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 모니터링 설정

### Sentry 에러 트래킹
```bash
# 프론트엔드
npm install @sentry/nextjs

# 백엔드
npm install @sentry/node
```

### Health Check 엔드포인트
```typescript
// backend/src/routes/health.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

## 성능 최적화

### 프론트엔드
- Next.js Image 최적화
- Code splitting
- Bundle analyzer

### 백엔드
- 데이터베이스 인덱싱
- Redis 캐싱
- CDN 설정

## 보안 체크리스트

- [ ] HTTPS 설정
- [ ] CORS 정책 검토
- [ ] Rate limiting 설정
- [ ] JWT 시크릿 보안
- [ ] 환경 변수 암호화
- [ ] 파일 업로드 검증
- [ ] SQL Injection 방어
- [ ] XSS 방어