#!/bin/bash

echo "🔧 OpenClass 백엔드 문제 해결"
echo "================================"

cd /Users/richard_kim/openclass-production/backend

echo "📦 TypeScript 컴파일 테스트..."
npx tsc --noEmit

echo "🧹 캐시 정리..."
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist

echo "📦 의존성 재설치..."
npm install

echo "🏗️ 타입 체크..."
npx tsc --noEmit

echo "🚀 서버 시작 준비 완료!"
echo "이제 다음 명령어로 서버를 시작하세요:"
echo "npm run dev"
