#!/bin/bash

echo "👤 OpenClass 개인 프로필 시스템 설정"
echo "=================================="

# 데이터베이스 마이그레이션
echo "🔄 데이터베이스 마이그레이션 실행 중..."
cd /Users/richard_kim/openclass-production/backend
npx prisma generate
npx prisma db push

echo "✅ 데이터베이스 마이그레이션 완료!"
echo ""

echo "🎯 개인 프로필 시스템 기능:"
echo "- 👤 개인 프로필 페이지"
echo "- 📝 프로필 편집 기능"
echo "- 📊 활동 통계 대시보드"
echo "- 📄 내가 작성한 게시물"
echo "- ❤️ 좋아요한 게시물"
echo "- 🏫 좋아요한 강의실"
echo "- 📁 업로드한 파일"
echo "- 👍 좋아요 토글 기능"
echo "- 📱 반응형 UI"
echo ""

echo "🔗 접속 방법:"
echo "1. 백엔드 서버: http://localhost:5001"
echo "2. 프론트엔드: http://localhost:3000"
echo "3. 프로필 페이지: http://localhost:3000/profile"
echo ""

echo "📋 API 엔드포인트:"
echo "- GET /api/profile/me - 내 프로필 조회"
echo "- GET /api/profile/me/activity - 내 활동 조회"
echo "- PUT /api/profile/me - 프로필 업데이트"
echo "- POST /api/profile/post/:postId/like - 게시물 좋아요"
echo "- POST /api/profile/classroom/:classroomId/like - 강의실 좋아요"
echo ""

echo "🎉 개인 프로필 시스템이 준비되었습니다!"
echo "이제 사용자가 자신의 활동을 한눈에 볼 수 있습니다!"
