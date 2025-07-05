#!/bin/bash

echo "🚀 OpenClass 자동 설치를 시작합니다..."
echo ""

# 에러 발생 시 스크립트 중단
set -e

# 프로젝트 디렉토리로 이동
cd /Users/richard_kim/openclass-production

echo "📦 1/7: 루트 의존성 설치 중..."
npm install

echo "🎨 2/7: 프론트엔드 의존성 설치 중..."
cd frontend
npm install
cd ..

echo "⚙️ 3/7: 백엔드 의존성 설치 중..."
cd backend
npm install

echo "🗄️ 4/7: Prisma 클라이언트 생성 중..."
npx prisma generate

echo "📊 5/7: 데이터베이스 생성 중..."
npx prisma db push

echo "🌱 6/7: 샘플 데이터 생성 중..."
npm run db:seed

echo "🎉 7/7: 설치 완료!"
cd ..

echo ""
echo "✅ 모든 설치가 완료되었습니다!"
echo ""
echo "🚀 개발 서버를 시작하려면 다음 명령어를 실행하세요:"
echo "   npm run dev"
echo ""
echo "📱 실행 후 접속 주소:"
echo "   프론트엔드: http://localhost:3000"
echo "   백엔드 API: http://localhost:5000"
echo "   상태 확인: http://localhost:5000/health"
echo ""