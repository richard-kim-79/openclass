#!/bin/bash

echo "🔄 데이터베이스 연결 확인 및 재설정..."
echo ""

cd /Users/richard_kim/openclass-production/backend

echo "📊 1/4: 현재 상태 확인..."
ls -la dev.db 2>/dev/null && echo "✅ dev.db 파일 존재" || echo "❌ dev.db 파일 없음"

echo ""
echo "🗄️ 2/4: 데이터베이스 생성 및 스키마 적용..."
npx prisma db push

echo ""
echo "🌱 3/4: 샘플 데이터 생성..."
npm run db:seed

echo ""
echo "📊 4/4: 데이터베이스 파일 확인..."
ls -la dev.db

echo ""
echo "✅ 데이터베이스 설정 완료!"
echo ""
echo "🔍 확인 방법:"
echo "   1. 브라우저에서 http://localhost:5001/db-status 접속"
echo "   2. 데이터베이스 상태 및 데이터 개수 확인"
echo "   3. http://localhost:5001/api/posts 에서 샘플 게시물 확인"
echo ""