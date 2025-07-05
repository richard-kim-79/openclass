# 🛠️ OpenClass 문제 해결 가이드

## 🎯 개요

이 문서는 OpenClass 개발 및 사용 중 발생할 수 있는 일반적인 문제들과 해결 방법을 제공합니다.

## 🚨 일반적인 문제들

### 1. 서버 실행 관련 문제

#### 🔴 **포트 충돌 오류**
```bash
# 문제: Error: listen EADDRINUSE :::5001
# 원인: 포트 5001이 이미 사용 중

# 해결책 1: 사용 중인 프로세스 종료
lsof -ti:5001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# 해결책 2: 다른 포트 사용
cd backend
PORT=5002 npm run dev
cd ../frontend
PORT=3001 npm run dev
```

#### 🔴 **의존성 설치 오류**
```bash
# 문제: npm install 실패, 패키지 충돌

# 해결책: 캐시 정리 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 개별 폴더 정리
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

#### 🔴 **환경 변수 오류**
```bash
# 문제: .env 파일 누락 또는 잘못된 설정

# 해결책: 환경 변수 확인
# backend/.env
PORT=5001
DATABASE_URL="file:/Users/richard_kim/openclass-production/backend/prisma/dev.db"
JWT_SECRET=openclass-super-secret-jwt-key-2024-development-only

# frontend/.env.local  
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

---

### 2. 데이터베이스 관련 문제

#### 🔴 **데이터베이스 연결 실패**
```bash
# 문제: Prisma connection 오류

# 해결책 1: 데이터베이스 재생성
cd backend
rm -f prisma/dev.db
npx prisma generate
npx prisma db push
npm run db:seed

# 해결책 2: 권한 확인
chmod 755 prisma/
chmod 644 prisma/dev.db
```

#### 🔴 **마이그레이션 오류**
```bash
# 문제: 스키마 변경 후 마이그레이션 실패

# 해결책: 데이터베이스 리셋
cd backend
npx prisma migrate reset
npx prisma db push
npm run db:seed
```

#### 🔴 **시드 데이터 오류**
```bash
# 문제: npm run db:seed 실패

# 해결책: 시드 스크립트 재실행
cd backend
rm -f prisma/dev.db
npx prisma db push
npm run db:seed
```

---

### 3. 프론트엔드 관련 문제

#### 🔴 **Next.js 빌드 오류**
```bash
# 문제: TypeScript 컴파일 오류

# 해결책 1: 타입 검사
cd frontend
npm run type-check

# 해결책 2: 캐시 정리
rm -rf .next
npm run dev
```

#### 🔴 **500 Internal Server Error**
```bash
# 문제: 프론트엔드 페이지 500 오류

# 해결책 1: 서버 로그 확인
# 터미널에서 에러 메시지 확인

# 해결책 2: API URL 확인
# .env.local에서 NEXT_PUBLIC_API_URL 확인
NEXT_PUBLIC_API_URL=http://localhost:5001
```

#### 🔴 **API 연결 오류**
```bash
# 문제: fetch 요청 실패, CORS 오류

# 해결책 1: 백엔드 서버 상태 확인
curl http://localhost:5001/health

# 해결책 2: CORS 설정 확인
# backend/src/config/cors.ts 파일 확인
```

---

### 4. 인증 관련 문제

#### 🔴 **로그인 실패**
```bash
# 문제: 403 Unauthorized, 토큰 오류

# 해결책 1: 브라우저 저장소 정리
# 개발자 도구 > Application > Local Storage > 모두 삭제

# 해결책 2: JWT 시크릿 확인
# backend/.env에서 JWT_SECRET 확인
```

#### 🔴 **자동 로그아웃**
```bash
# 문제: 페이지 새로고침 시 로그아웃

# 해결책: 토큰 저장 확인
# localStorage에 토큰이 제대로 저장되는지 확인
console.log(localStorage.getItem('openclass_access_token'))
```

---

### 5. 파일 업로드 관련 문제

#### 🔴 **파일 업로드 실패**
```bash
# 문제: Cloudinary 업로드 오류

# 해결책 1: Cloudinary 설정 확인
# backend/.env에서 CLOUDINARY_* 변수 확인
curl http://localhost:5001/api/files/test

# 해결책 2: 파일 크기 확인
# 50MB 이하인지 확인
```

#### 🔴 **파일 형식 오류**
```bash
# 문제: 지원되지 않는 파일 형식

# 해결책: 지원되는 형식 확인
# 이미지: jpg, png, gif, webp
# 문서: pdf, doc, docx, ppt, pptx
# 기타: txt, md, mp4, mp3, wav
```

---

## 🔍 진단 도구

### 1. **서버 상태 확인**
```bash
# 백엔드 상태
curl http://localhost:5001/health

# 데이터베이스 상태
curl http://localhost:5001/db-status

# API 테스트
cd /Users/richard_kim/openclass-production
./test-api.sh
```

### 2. **로그 확인**
```bash
# 백엔드 로그
cd backend
npm run dev
# 터미널에서 에러 메시지 확인

# 프론트엔드 로그
cd frontend
npm run dev
# 브라우저 개발자 도구 Console 탭 확인
```

### 3. **데이터베이스 확인**
```bash
# Prisma Studio 실행
cd backend
npx prisma studio
# http://localhost:5555에서 데이터 확인
```

---

## 📊 성능 최적화

### 1. **메모리 사용량 최적화**
```bash
# Node.js 메모리 제한 증가
node --max-old-space-size=4096 --heap-limit=4096

# 캐시 정리
npm cache clean --force
rm -rf node_modules/.cache
```

### 2. **빌드 최적화**
```bash
# Next.js 빌드 최적화
cd frontend
rm -rf .next
npm run build

# TypeScript 컴파일 최적화
cd backend
rm -rf dist
npm run build
```

---

## 🚀 개발 팁

### 1. **효율적인 개발 워크플로우**
```bash
# 동시 서버 실행
npm run dev

# 별도 터미널에서 DB 관리
cd backend && npx prisma studio

# API 테스트 자동화
./test-api.sh
```

### 2. **디버깅 도구**
```bash
# 백엔드 디버깅
cd backend
npm run dev
# VS Code에서 breakpoint 설정

# 프론트엔드 디버깅
# 브라우저 개발자 도구 사용
# React Developer Tools 설치
```

### 3. **코드 품질 관리**
```bash
# TypeScript 타입 검사
cd frontend && npm run type-check
cd backend && npm run type-check

# 코드 스타일 검사
npm run lint
```

---

## 🆘 긴급 복구 가이드

### 전체 시스템 초기화
```bash
# 1. 프로세스 종료
lsof -ti:3000,5001 | xargs kill -9

# 2. 의존성 재설치
rm -rf node_modules package-lock.json
rm -rf backend/node_modules frontend/node_modules
npm install

# 3. 데이터베이스 초기화
cd backend
rm -f prisma/dev.db
npx prisma generate
npx prisma db push
npm run db:seed

# 4. 캐시 정리
cd ../frontend
rm -rf .next
cd ..

# 5. 서버 재시작
npm run dev
```

---

## 📞 추가 지원

### 문서 참조
- **설치 가이드**: `INSTALLATION_GUIDE.md`
- **개발 상황**: `DEVELOPMENT_STATUS.md`
- **README**: `README.md`

### 로그 파일 위치
- **백엔드 로그**: `backend/logs/`
- **프론트엔드 로그**: 브라우저 콘솔
- **데이터베이스**: `backend/prisma/dev.db`

### 환경 변수 템플릿
- **백엔드**: `backend/.env.example`
- **프론트엔드**: `frontend/.env.example`

---

**🎯 대부분의 문제는 위의 해결 방법으로 해결 가능합니다. 문제가 지속되면 프로젝트를 초기화 후 다시 시작하는 것을 권장합니다.**
