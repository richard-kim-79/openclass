#!/bin/bash

echo "🚀 OpenClass AI 검색 시스템 설치 및 시작"
echo "============================================"

# Frontend lodash 설치
echo "📦 프론트엔드 의존성 설치 중..."
cd /Users/richard_kim/openclass-production/frontend
npm install lodash @types/lodash

# Backend 의존성 확인
echo "📦 백엔드 의존성 확인 중..."
cd /Users/richard_kim/openclass-production/backend
npm install

echo "✅ 설치 완료!"
echo ""
echo "🔧 다음 단계:"
echo "1. 백엔드 서버 시작: cd backend && npm run dev"
echo "2. 프론트엔드 서버 시작: cd frontend && npm run dev"
echo "3. AI 검색 페이지 접속: http://localhost:3000/ai-search"
echo ""
echo "💡 참고:"
echo "- OpenAI API 키가 .env 파일에 설정되어 있는지 확인하세요"
echo "- 백엔드 서버가 먼저 실행되어야 합니다"
