#!/bin/bash

echo "🔍 OpenClass 프로젝트 설정 상태를 확인합니다..."
echo ""

# 프로젝트 디렉토리 확인
if [ -d "/Users/richard_kim/openclass-production" ]; then
    echo "✅ 프로젝트 디렉토리 존재: /Users/richard_kim/openclass-production"
else
    echo "❌ 프로젝트 디렉토리 없음"
    exit 1
fi

cd /Users/richard_kim/openclass-production

# 환경 변수 파일 확인
if [ -f "frontend/.env.local" ]; then
    echo "✅ 프론트엔드 환경 변수 파일 생성됨"
else
    echo "❌ frontend/.env.local 파일 없음"
fi

if [ -f "backend/.env" ]; then
    echo "✅ 백엔드 환경 변수 파일 생성됨"
else
    echo "❌ backend/.env 파일 없음"
fi

# package.json 파일들 확인
if [ -f "package.json" ]; then
    echo "✅ 루트 package.json 존재"
else
    echo "❌ 루트 package.json 없음"
fi

if [ -f "frontend/package.json" ]; then
    echo "✅ 프론트엔드 package.json 존재"
else
    echo "❌ 프론트엔드 package.json 없음"
fi

if [ -f "backend/package.json" ]; then
    echo "✅ 백엔드 package.json 존재"
else
    echo "❌ 백엔드 package.json 없음"
fi

# Prisma 스키마 확인
if [ -f "backend/prisma/schema.prisma" ]; then
    echo "✅ Prisma 스키마 존재"
else
    echo "❌ Prisma 스키마 없음"
fi

echo ""
echo "📋 다음 단계 안내:"
echo "1. 터미널에서 다음 명령어들을 실행하세요:"
echo ""
echo "   cd /Users/richard_kim/openclass-production"
echo "   npm install"
echo "   cd frontend && npm install"
echo "   cd ../backend && npm install"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo "   npm run db:seed"
echo ""
echo "2. 모든 설치가 완료되면:"
echo "   cd /Users/richard_kim/openclass-production"
echo "   npm run dev"
echo ""
echo "🎉 1단계 환경 설정 준비가 완료되었습니다!"