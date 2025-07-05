# OpenClass 프로젝트 구조

```
openclass-production/
├── 📁 frontend/                 # Next.js 프론트엔드
│   ├── 📁 app/                 # Next.js 13+ App Router
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx           # 홈페이지
│   │   ├── providers.tsx      # React Query 등 프로바이더
│   │   └── globals.css        # 글로벌 스타일
│   ├── 📁 components/          # React 컴포넌트
│   │   ├── 📁 common/         # 공통 컴포넌트
│   │   │   ├── MainLayout.tsx # 메인 레이아웃
│   │   │   ├── Header.tsx     # 헤더
│   │   │   └── Sidebar.tsx    # 사이드바
│   │   ├── 📁 home/           # 홈 관련 컴포넌트
│   │   ├── 📁 classroom/      # 강의실 관련 컴포넌트
│   │   ├── 📁 search/         # 검색 관련 컴포넌트
│   │   ├── 📁 dashboard/      # 대시보드 관련 컴포넌트
│   │   └── 📁 auth/           # 인증 관련 컴포넌트
│   ├── 📁 hooks/              # Custom React Hooks
│   │   ├── usePosts.ts        # 게시물 관련 훅
│   │   ├── useClassrooms.ts   # 강의실 관련 훅
│   │   └── useSearch.ts       # 검색 관련 훅
│   ├── 📁 lib/                # 유틸리티 & 설정
│   │   └── api.ts             # Axios API 클라이언트
│   ├── 📁 stores/             # Zustand 상태 관리
│   │   ├── authStore.ts       # 인증 상태
│   │   └── uiStore.ts         # UI 상태
│   ├── 📁 types/              # TypeScript 타입 정의
│   ├── package.json           # 프론트엔드 패키지 설정
│   ├── next.config.js         # Next.js 설정
│   ├── tailwind.config.js     # TailwindCSS 설정
│   ├── tsconfig.json          # TypeScript 설정
│   └── .env.example           # 환경 변수 예시
│
├── 📁 backend/                  # Express.js 백엔드
│   ├── 📁 src/                # 소스 코드
│   │   ├── 📁 controllers/    # 컨트롤러 (향후 구현)
│   │   ├── 📁 routes/         # API 라우트
│   │   │   ├── auth.ts        # 인증 라우트
│   │   │   ├── users.ts       # 사용자 라우트
│   │   │   ├── classrooms.ts  # 강의실 라우트
│   │   │   ├── posts.ts       # 게시물 라우트
│   │   │   └── search.ts      # 검색 라우트
│   │   ├── 📁 middleware/     # 미들웨어
│   │   │   ├── auth.ts        # 인증 미들웨어
│   │   │   ├── errorHandler.ts # 에러 핸들러
│   │   │   └── notFound.ts    # 404 핸들러
│   │   ├── 📁 services/       # 비즈니스 로직 (향후 구현)
│   │   ├── 📁 utils/          # 유틸리티 (향후 구현)
│   │   ├── 📁 config/         # 설정 파일
│   │   │   ├── cors.ts        # CORS 설정
│   │   │   └── socket.ts      # Socket.IO 설정
│   │   └── index.ts           # 메인 서버 파일
│   ├── 📁 prisma/             # Prisma ORM
│   │   ├── schema.prisma      # 데이터베이스 스키마
│   │   └── seed.ts           # 시드 데이터
│   ├── package.json           # 백엔드 패키지 설정
│   ├── tsconfig.json          # TypeScript 설정
│   └── .env.example           # 환경 변수 예시
│
├── 📁 shared/                   # 공통 타입 & 유틸
│   ├── types.ts               # 공통 타입 정의
│   ├── index.ts               # 공통 exports
│   └── package.json           # 공통 패키지 설정
│
├── 📁 docs/                     # 프로젝트 문서
│   ├── API.md                 # API 문서
│   └── DEPLOYMENT.md          # 배포 가이드
│
├── package.json                 # 루트 패키지 설정 (워크스페이스)
├── README.md                    # 프로젝트 소개
├── .gitignore                   # Git 무시 파일
├── setup.sh                     # Linux/Mac 설치 스크립트
└── setup.bat                    # Windows 설치 스크립트
```

## 주요 특징

### ✅ 완성된 기능
- **모노레포 구조**: 프론트엔드, 백엔드, 공통 타입을 하나의 저장소에서 관리
- **현대적 기술 스택**: Next.js 14, TypeScript, Prisma, Socket.IO
- **완전한 인증 시스템**: JWT 기반 로그인/회원가입
- **실시간 기능**: Socket.IO를 통한 실시간 채팅
- **REST API**: 완전한 CRUD 작업 지원
- **데이터베이스 스키마**: PostgreSQL + Prisma ORM
- **타입 안정성**: 완전한 TypeScript 지원
- **상태 관리**: Zustand + React Query
- **반응형 UI**: TailwindCSS + 모바일 최적화

### 🚧 향후 구현 예정
- **AI 검색**: OpenAI Embeddings + 벡터 검색
- **파일 업로드**: Cloudinary 연동
- **소셜 로그인**: Google, GitHub OAuth
- **실시간 알림**: 브라우저 푸시 알림
- **비디오 스트리밍**: 라이브 강의 기능
- **결제 시스템**: 구독 및 유료 강의

## 🚀 빠른 시작

### 1. 설치
```bash
# 자동 설치 (권장)
chmod +x setup.sh
./setup.sh

# 또는 수동 설치
npm install
cd frontend && npm install
cd ../backend && npm install && npx prisma generate
```

### 2. 환경 설정
```bash
# 환경 변수 파일 생성
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# backend/.env에서 DATABASE_URL 설정
DATABASE_URL="postgresql://username:password@localhost:5432/openclass"
```

### 3. 데이터베이스 설정
```bash
cd backend
npm run db:push    # 스키마 적용
npm run db:seed    # 샘플 데이터 생성
```

### 4. 개발 서버 실행
```bash
npm run dev        # 프론트엔드 + 백엔드 동시 실행
```

## 📊 기술 스택 상세

### 프론트엔드
- **Framework**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: TailwindCSS
- **상태관리**: Zustand + React Query
- **HTTP**: Axios
- **실시간**: Socket.io-client
- **UI 라이브러리**: Lucide React (아이콘)

### 백엔드
- **Runtime**: Node.js
- **Framework**: Express.js
- **언어**: TypeScript
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **인증**: JWT
- **실시간**: Socket.io
- **검증**: Zod

### 개발 도구
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Database**: Prisma Studio
- **Development**: tsx (TypeScript 실행)

## 📱 주요 페이지 및 기능

### 1. 홈 페이지 (/)
- 학습자료 피드
- 강의실 목록
- 무한 스크롤

### 2. 대시보드 (/dashboard)
- 개인 통계
- 최근 활동
- 성과 분석

### 3. AI 검색 (/search)
- 자연어 검색
- 관련도 점수
- 통합 검색 결과

### 4. 강의실 (/classroom/[id])
- 실시간 채팅
- 파일 공유
- 멤버 관리

### 5. 설정 (/settings)
- 프로필 관리
- API 키 관리
- 알림 설정

## 🔐 보안 고려사항

- JWT 토큰 기반 인증
- API Rate Limiting
- CORS 설정
- 입력 검증 (Zod)
- XSS/CSRF 방어
- Helmet.js 보안 헤더

## 📈 확장성

### 단계별 확장 계획
1. **Phase 1**: 기본 기능 안정화
2. **Phase 2**: AI 검색 고도화
3. **Phase 3**: 실시간 협업 기능
4. **Phase 4**: 모바일 앱 개발

### 성능 최적화
- 데이터베이스 인덱싱
- Redis 캐싱 (향후)
- CDN 연동 (향후)
- 이미지 최적화

## 🤝 기여 가이드

1. 이슈 생성 또는 기존 이슈 확인
2. 브랜치 생성: `feature/기능명`
3. 커밋 메시지: `feat: 기능 설명`
4. Pull Request 생성

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

**🎉 OpenClass 프로젝트가 성공적으로 설정되었습니다!**

문제가 발생하면 docs/ 폴더의 문서를 참조하거나 이슈를 생성해 주세요.