#!/bin/bash

echo "🔄 채팅 시스템 데이터베이스 마이그레이션"
echo "========================================"

cd /Users/richard_kim/openclass-production/backend

echo "📦 Prisma 클라이언트 생성..."
npx prisma generate

echo "🗄️ 데이터베이스 스키마 업데이트..."
npx prisma db push

echo "✅ 마이그레이션 완료!"
echo ""
echo "🔧 추가된 기능:"
echo "- 실시간 채팅 메시지"
echo "- 메시지 읽음 표시"
echo "- 이모지 반응 시스템"
echo "- 답글 기능"
echo "- 사용자 온라인 상태"
echo "- 메시지 편집/삭제"
echo ""
echo "💡 다음 단계: 백엔드 서버를 재시작하세요"
