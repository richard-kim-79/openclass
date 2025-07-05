#!/bin/bash

echo "🚀 OpenClass 서버 시작 스크립트"
echo "================================"

# 프로젝트 디렉토리로 이동
cd /Users/richard_kim/openclass-production

echo "📦 의존성 설치 중..."

# 루트 의존성 설치
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# 백엔드 의존성 설치
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# 프론트엔드 의존성 설치
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "🗃️ 데이터베이스 설정 중..."

# 데이터베이스 설정
cd backend
npx prisma generate
npx prisma db push

# 시드 데이터 생성
echo "🌱 시드 데이터 생성 중..."
npm run db:seed

echo "✅ 설치 완료!"
echo ""
echo "🎉 이제 다음 명령어로 서버들을 실행하세요:"
echo ""
echo "터미널 1 (백엔드):"
echo "cd /Users/richard_kim/openclass-production/backend"
echo "npm run dev"
echo ""
echo "터미널 2 (프론트엔드):"
echo "cd /Users/richard_kim/openclass-production/frontend"
echo "npm run dev"
echo ""
echo "또는 루트에서 동시 실행:"
echo "cd /Users/richard_kim/openclass-production"
echo "npm run dev"
echo ""
echo "🌐 실행 후 접속 주소:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5001"
echo "Health Check: http://localhost:5001/health"
echo "DB Status: http://localhost:5001/db-status"
