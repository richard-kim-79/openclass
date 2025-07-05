#!/bin/bash

echo "🚀 OpenClass 실시간 채팅 시스템 시작"
echo "====================================="

# 데이터베이스 마이그레이션
echo "🔄 데이터베이스 마이그레이션 실행 중..."
cd /Users/richard_kim/openclass-production/backend
npx prisma generate
npx prisma db push

echo "✅ 데이터베이스 마이그레이션 완료!"
echo ""

echo "🎯 채팅 시스템 기능:"
echo "- 💬 실시간 메시지 전송"
echo "- 📱 모바일 반응형 UI"
echo "- 😊 이모지 반응 시스템"
echo "- 💾 메시지 읽음 표시"
echo "- 👥 온라인 사용자 목록"
echo "- 🔄 타이핑 상태 표시"
echo "- 📎 파일 첨부 기능"
echo "- 💬 답글 및 메시지 편집"
echo ""

echo "🔗 접속 방법:"
echo "1. 백엔드 서버: http://localhost:5001"
echo "2. 프론트엔드: http://localhost:3000"
echo "3. 채팅 페이지: http://localhost:3000/chat"
echo ""

echo "📋 다음 단계:"
echo "1. 백엔드 서버 시작: cd backend && npm run dev"
echo "2. 프론트엔드 서버 시작: cd frontend && npm run dev"
echo "3. 브라우저에서 /chat 페이지 접속"
echo ""

echo "🎉 OpenClass 실시간 채팅 시스템이 준비되었습니다!"
