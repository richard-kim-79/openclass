#!/bin/bash

echo "🔧 SQLite 호환성 수정 후 시드 데이터 재생성..."
echo ""

cd /Users/richard_kim/openclass-production/backend

echo "🗄️ 데이터베이스 초기화 중..."
rm -f dev.db
npx prisma db push

echo "🌱 샘플 데이터 생성 중..."
npm run db:seed

echo ""
echo "✅ 수정 완료!"
echo ""
echo "🚀 이제 개발 서버를 실행하세요:"
echo "   cd /Users/richard_kim/openclass-production"
echo "   npm run dev"
echo ""