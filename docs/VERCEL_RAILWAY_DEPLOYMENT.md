# 🚀 Vercel + Railway 배포 가이드

OpenClass AI 학습 플랫폼을 Vercel과 Railway를 사용하여 배포하는 방법입니다.

## 📋 사전 요구사항

### 1. 계정 생성
- [Vercel](https://vercel.com) 계정
- [Railway](https://railway.app) 계정
- [GitHub](https://github.com) 계정

### 2. API 키 준비
- [Cloudinary](https://cloudinary.com) API 키
- [OpenAI](https://platform.openai.com) API 키

## 🚀 자동 배포 (권장)

### 1단계: 자동 배포 스크립트 실행

```bash
./deploy-vercel-railway.sh
```

이 스크립트는 다음 작업을 자동으로 수행합니다:
- Railway CLI 설치 및 로그인
- Vercel CLI 설치 및 로그인
- 백엔드를 Railway에 배포
- 프론트엔드를 Vercel에 배포
- 환경 변수 설정
- CORS 설정

### 2단계: 환경 변수 설정

Railway 대시보드에서 다음 환경 변수들을 설정하세요:

```env
# 필수 환경 변수
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
NODE_ENV=production

# API 키들
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
OPENAI_API_KEY=your-openai-key

# CORS 설정 (Vercel 도메인)
CORS_ORIGIN=https://your-app.vercel.app
```

## 🔧 수동 배포

### Railway 백엔드 배포

1. **Railway CLI 설치**
```bash
npm install -g @railway/cli
```

2. **로그인**
```bash
railway login
```

3. **프로젝트 초기화**
```bash
railway init
```

4. **백엔드 배포**
```bash
railway up --service openclass-backend
```

5. **도메인 확인**
```bash
railway domain --service openclass-backend
```

### Vercel 프론트엔드 배포

1. **Vercel CLI 설치**
```bash
npm install -g vercel
```

2. **로그인**
```bash
vercel login
```

3. **프론트엔드 배포**
```bash
cd frontend
vercel --prod
```

4. **환경 변수 설정**
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Railway 백엔드 URL 입력
```

## 📊 배포 확인

### 헬스체크
- 백엔드: `https://your-backend.railway.app/health`
- 프론트엔드: `https://your-app.vercel.app`

### API 문서
- 백엔드: `https://your-backend.railway.app/docs`

### 데이터베이스 상태
- 백엔드: `https://your-backend.railway.app/db-status`

## 🔧 추가 설정

### 1. 커스텀 도메인 설정

#### Railway 백엔드
```bash
railway domain --service openclass-backend
# 커스텀 도메인 입력
```

#### Vercel 프론트엔드
```bash
vercel domains add your-domain.com
```

### 2. SSL 인증서 확인
- Railway: 자동으로 SSL 인증서 제공
- Vercel: 자동으로 SSL 인증서 제공

### 3. 환경별 설정

#### 개발 환경
```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### 프로덕션 환경
```env
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
```

## 📈 모니터링

### Railway 모니터링
- 로그 확인: `railway logs --service openclass-backend`
- 메트릭 확인: Railway 대시보드
- 알림 설정: Railway 대시보드

### Vercel 모니터링
- 로그 확인: Vercel 대시보드
- 성능 분석: Vercel Analytics
- 에러 추적: Vercel 대시보드

## 🔄 CI/CD 설정

### GitHub Actions 워크플로우

`.github/workflows/deploy.yml` 파일이 자동으로 생성됩니다:

```yaml
name: Deploy to Vercel and Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service openclass-backend
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          cd frontend
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 🛠️ 문제 해결

### 일반적인 문제들

1. **CORS 오류**
   - Railway에서 CORS_ORIGIN 환경 변수 확인
   - Vercel 도메인이 정확히 설정되었는지 확인

2. **데이터베이스 연결 오류**
   - DATABASE_URL 환경 변수 확인
   - Railway PostgreSQL 서비스 상태 확인

3. **빌드 오류**
   - 로그 확인: `railway logs --service openclass-backend`
   - 의존성 설치 확인

4. **환경 변수 오류**
   - Railway 대시보드에서 환경 변수 확인
   - 변수명과 값이 정확한지 확인

### 로그 확인

```bash
# Railway 로그
railway logs --service openclass-backend

# Vercel 로그
vercel logs
```

## 📚 추가 리소스

- [Railway 문서](https://docs.railway.app)
- [Vercel 문서](https://vercel.com/docs)
- [OpenClass API 문서](./API.md)
- [프로젝트 구조](./PROJECT_STRUCTURE.md)

## 🎉 배포 완료!

배포가 완료되면 다음 URL들로 접근할 수 있습니다:

- **프론트엔드**: `https://your-app.vercel.app`
- **백엔드**: `https://your-backend.railway.app`
- **API 문서**: `https://your-backend.railway.app/docs`

모든 설정이 완료되면 OpenClass AI 학습 플랫폼을 사용할 수 있습니다! 🚀 