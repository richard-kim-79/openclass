#!/bin/bash

echo "🚀 OpenClass 프로젝트 설정을 시작합니다..."

# 루트 디렉토리 의존성 설치
echo "📦 루트 의존성 설치 중..."
npm install

# 프론트엔드 설정
echo "🎨 프론트엔드 설정 중..."
cd frontend
npm install
cd ..

# 백엔드 설정
echo "⚙️ 백엔드 설정 중..."
cd backend
npm install

# Prisma 설정
echo "🗄️ 데이터베이스 설정 중..."
npx prisma generate

cd ..

# 환경 변수 파일 생성
echo "🔧 환경 변수 파일 생성 중..."
if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✅ frontend/.env.local 파일이 생성되었습니다."
else
    echo "⚠️ frontend/.env.local 파일이 이미 존재합니다."
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ backend/.env 파일이 생성되었습니다."
else
    echo "⚠️ backend/.env 파일이 이미 존재합니다."
fi

echo ""
echo "🎉 프로젝트 설정이 완료되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "1. backend/.env 파일에서 DATABASE_URL을 실제 PostgreSQL URL로 변경"
echo "2. JWT_SECRET 등 보안 키들을 안전한 값으로 변경"
echo "3. 데이터베이스 마이그레이션 실행: cd backend && npm run db:push"
echo "4. 시드 데이터 생성: cd backend && npm run db:seed"
echo "5. 개발 서버 실행: npm run dev"
echo ""
echo "📚 자세한 내용은 README.md를 참조하세요."