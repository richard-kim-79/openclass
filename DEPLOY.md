# 🚀 OpenClass 간단 배포 가이드

## ⚡ 빠른 시작

### 1단계: 배포 환경 설정
```bash
# 스크립트 실행 권한 부여
chmod +x setup-deployment.sh deploy.sh

# 배포 환경 설정 (환경 변수, 플랫폼 선택)
./setup-deployment.sh
```

### 2단계: GitHub에 업로드 및 배포
```bash
# 자동 배포 실행
./deploy.sh
```

## 🎯 배포 플랫폼별 가이드

### 방법 1: Vercel + Railway (권장)

#### 백엔드 (Railway)
1. [Railway](https://railway.app) 회원가입
2. GitHub 저장소 연결
3. 환경 변수 설정:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_secret
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   ```

#### 프론트엔드 (Vercel)
1. [Vercel](https://vercel.com) 회원가입
2. GitHub 저장소 연결
3. Root Directory: `frontend`
4. 환경 변수 설정:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

### 방법 2: Docker (DigitalOcean/AWS)

```bash
# Docker 이미지 빌드
docker build -t openclass-backend -f Dockerfile.backend .
docker build -t openclass-frontend -f Dockerfile.frontend .

# Docker Compose로 실행
docker-compose up -d
```

## 📋 필수 준비사항

### 🗃️ 데이터베이스
- **개발**: SQLite (현재 설정)
- **프로덕션**: PostgreSQL 필요

### 🔐 환경 변수
```env
# 백엔드
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=강력한_비밀키
JWT_REFRESH_SECRET=강력한_리프레시_키
CLOUDINARY_CLOUD_NAME=클라우디너리_이름
CLOUDINARY_API_KEY=클라우디너리_키
CLOUDINARY_API_SECRET=클라우디너리_시크릿

# 프론트엔드
NEXT_PUBLIC_API_URL=백엔드_도메인
NEXT_PUBLIC_SOCKET_URL=백엔드_도메인
```

## ✅ 배포 후 확인사항

1. **백엔드 상태 확인**
   - `https://your-backend.com/health` → `{"status": "OK"}`

2. **프론트엔드 접속 확인**
   - 웹사이트 정상 로드
   - 로그인/회원가입 테스트

3. **기능 테스트**
   - 파일 업로드
   - 대시보드 접근
   - API 연동 확인

## 🆘 문제 해결

### 빌드 오류
```bash
# 의존성 재설치
npm install
cd backend && npm install
cd ../frontend && npm install

# 캐시 정리
npm cache clean --force
```

### 데이터베이스 연결 오류
```bash
# 프로덕션 DB 마이그레이션
./migrate-production.sh
```

### 환경 변수 오류
- GitHub Secrets 확인
- 플랫폼별 환경 변수 설정 재확인

## 🎉 성공!

배포가 완료되면:
- 🌐 **프론트엔드**: https://your-app.vercel.app
- 🔧 **백엔드**: https://your-backend.railway.app
- 📊 **관리**: GitHub Actions에서 배포 상태 확인

**OpenClass가 전 세계에서 접속 가능한 AI 학습 플랫폼으로 배포 완료!** 🎓✨
