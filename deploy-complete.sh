#!/bin/bash

echo "🎉 OpenClass 배포 완료 설정"
echo "=================================================="

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 배포 정보
BACKEND_URL="https://openclass20250703-production.up.railway.app"
FRONTEND_URL="https://openclass-frontend.vercel.app"

echo ""
log_success "🎉 OpenClass 배포 완료!"
echo ""
echo "📱 배포된 서비스 정보:"
echo "  🔧 백엔드: $BACKEND_URL"
echo "  🌐 프론트엔드: $FRONTEND_URL"
echo ""
echo "📊 확인 가능한 엔드포인트:"
echo "  🩺 헬스체크: $BACKEND_URL/health"
echo "  📊 DB 상태: $BACKEND_URL/db-status"
echo "  📚 API 루트: $BACKEND_URL/"
echo ""
echo "🔧 다음 단계:"
echo "  1. Railway 환경 변수 설정"
echo "  2. Vercel 환경 변수 설정"
echo "  3. API 키 설정"
echo "  4. 테스트 실행"
echo ""

# Railway 환경 변수 설정 안내
log_info "Railway 환경 변수 설정:"
echo "  - DATABASE_URL (PostgreSQL)"
echo "  - JWT_SECRET"
echo "  - JWT_REFRESH_SECRET"
echo "  - CLOUDINARY_CLOUD_NAME"
echo "  - CLOUDINARY_API_KEY"
echo "  - CLOUDINARY_API_SECRET"
echo "  - OPENAI_API_KEY"
echo "  - CORS_ORIGIN ($FRONTEND_URL)"
echo ""

# Vercel 환경 변수 설정 안내
log_info "Vercel 환경 변수 설정:"
echo "  - NEXT_PUBLIC_API_URL ($BACKEND_URL)"
echo ""

# 테스트 명령어
log_info "테스트 명령어:"
echo "  # 헬스체크"
echo "  curl $BACKEND_URL/health"
echo ""
echo "  # API 루트"
echo "  curl $BACKEND_URL/"
echo ""
echo "  # 프론트엔드 접속"
echo "  open $FRONTEND_URL"
echo ""

# 대시보드 링크
log_info "관리 대시보드:"
echo "  📊 Railway: https://railway.app/project/b03b7fa3-ee48-407e-8a12-7b290d1e6e89"
echo "  🌐 Vercel: https://vercel.com/dashboard"
echo ""

echo "=================================================="
log_success "OpenClass AI 학습 플랫폼이 성공적으로 배포되었습니다!"
echo "==================================================" 