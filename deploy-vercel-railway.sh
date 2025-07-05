#!/bin/bash

echo "🚀 OpenClass Vercel + Railway 배포를 시작합니다..."
echo "=================================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수: 로그 출력
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. 사전 검사
log_info "1. 배포 전 검사 중..."

# Git 상태 확인
if ! git diff-index --quiet HEAD --; then
    log_warning "커밋되지 않은 변경사항이 있습니다."
    read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "배포가 취소되었습니다."
        exit 1
    fi
fi

# 2. Railway 백엔드 배포
log_info "2. Railway 백엔드 배포 중..."

# Railway CLI 확인
if ! command -v railway &> /dev/null; then
    log_warning "Railway CLI가 설치되지 않았습니다. 설치 중..."
    npm install -g @railway/cli
fi

# Railway 로그인 확인
if ! railway whoami &> /dev/null; then
    log_warning "Railway에 로그인이 필요합니다."
    railway login
fi

# Railway 프로젝트 초기화
if [ ! -f ".railway" ]; then
    log_info "Railway 프로젝트를 초기화합니다..."
    railway init
fi

# 백엔드 배포
log_info "백엔드를 Railway에 배포합니다..."
railway up --service openclass-backend

if [ $? -eq 0 ]; then
    log_success "Railway 백엔드 배포 완료!"
    
    # Railway URL 가져오기
    BACKEND_URL=$(railway domain --service openclass-backend)
    log_info "백엔드 URL: $BACKEND_URL"
else
    log_error "Railway 배포 실패!"
    exit 1
fi

# 3. Vercel 프론트엔드 배포
log_info "3. Vercel 프론트엔드 배포 중..."

# Vercel CLI 확인
if ! command -v vercel &> /dev/null; then
    log_warning "Vercel CLI가 설치되지 않았습니다. 설치 중..."
    npm install -g vercel
fi

# Vercel 로그인 확인
if ! vercel whoami &> /dev/null; then
    log_warning "Vercel에 로그인이 필요합니다."
    vercel login
fi

# 프론트엔드 환경 변수 설정
log_info "프론트엔드 환경 변수를 설정합니다..."
vercel env add NEXT_PUBLIC_API_URL production <<< "$BACKEND_URL"

# 프론트엔드 배포
log_info "프론트엔드를 Vercel에 배포합니다..."
cd frontend
vercel --prod

if [ $? -eq 0 ]; then
    log_success "Vercel 프론트엔드 배포 완료!"
    
    # Vercel URL 가져오기
    FRONTEND_URL=$(vercel ls --json | jq -r '.[0].url')
    log_info "프론트엔드 URL: $FRONTEND_URL"
else
    log_error "Vercel 배포 실패!"
    exit 1
fi

cd ..

# 4. 배포 후 설정
log_info "4. 배포 후 설정 중..."

# CORS 설정 업데이트
log_info "백엔드 CORS 설정을 업데이트합니다..."
railway variables set CORS_ORIGIN="$FRONTEND_URL" --service openclass-backend

# 환경 변수 설정 안내
log_warning "다음 환경 변수들을 Railway에서 설정해주세요:"
echo "  - CLOUDINARY_CLOUD_NAME"
echo "  - CLOUDINARY_API_KEY" 
echo "  - CLOUDINARY_API_SECRET"
echo "  - OPENAI_API_KEY"

# 5. 배포 완료
echo ""
echo "=================================================="
log_success "🎉 OpenClass 배포 완료!"
echo ""
echo "📱 프론트엔드: $FRONTEND_URL"
echo "🔧 백엔드: $BACKEND_URL"
echo "📊 Railway 대시보드: https://railway.app"
echo "🌐 Vercel 대시보드: https://vercel.com"
echo ""
echo "🔧 추가 설정:"
echo "  1. Railway에서 환경 변수 설정"
echo "  2. 도메인 연결 (선택사항)"
echo "  3. SSL 인증서 확인"
echo ""
echo "📚 문서:"
echo "  - API 문서: $BACKEND_URL/docs"
echo "  - 헬스체크: $BACKEND_URL/health"
echo ""
echo "==================================================" 