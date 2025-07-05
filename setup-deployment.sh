#!/bin/bash

# 🔧 OpenClass 배포 환경 설정 스크립트

echo "⚙️ OpenClass 배포 환경을 설정합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 배포 플랫폼 선택
echo -e "${BLUE}🎯 배포 플랫폼을 선택하세요:${NC}"
echo "1) Vercel + Railway (권장)"
echo "2) Docker + DigitalOcean"
echo "3) Manual setup"
read -p "선택 (1-3): " platform_choice

case $platform_choice in
    1)
        echo -e "${GREEN}✅ Vercel + Railway 설정을 시작합니다...${NC}"
        
        # Vercel CLI 설치 확인
        if ! command -v vercel &> /dev/null; then
            echo -e "${YELLOW}📦 Vercel CLI 설치 중...${NC}"
            npm install -g vercel
        fi
        
        # Railway CLI 설치 확인
        if ! command -v railway &> /dev/null; then
            echo -e "${YELLOW}📦 Railway CLI 설치 중...${NC}"
            npm install -g @railway/cli
        fi
        
        echo -e "${GREEN}✅ CLI 도구 설치 완료${NC}"
        ;;
    2)
        echo -e "${GREEN}✅ Docker 설정을 시작합니다...${NC}"
        
        # Docker 설치 확인
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker가 설치되지 않았습니다.${NC}"
            echo "Docker Desktop을 설치하고 다시 시도하세요."
            exit 1
        fi
        
        echo -e "${GREEN}✅ Docker 확인 완료${NC}"
        ;;
    3)
        echo -e "${YELLOW}⚠️  수동 설정을 선택했습니다.${NC}"
        ;;
    *)
        echo -e "${RED}❌ 잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

# 2. 환경 변수 설정
echo -e "${BLUE}🔐 환경 변수를 설정합니다...${NC}"

# 프로덕션 환경 변수 파일 생성
if [ ! -f "backend/.env.production" ]; then
    echo -e "${YELLOW}📝 백엔드 프로덕션 환경 변수 파일을 생성합니다...${NC}"
    
    echo "DATABASE_URL을 입력하세요 (PostgreSQL):"
    read database_url
    
    echo "JWT_SECRET을 입력하세요:"
    read jwt_secret
    
    echo "JWT_REFRESH_SECRET을 입력하세요:"
    read jwt_refresh_secret
    
    echo "CLOUDINARY_CLOUD_NAME을 입력하세요:"
    read cloudinary_name
    
    echo "CLOUDINARY_API_KEY를 입력하세요:"
    read cloudinary_key
    
    echo "CLOUDINARY_API_SECRET를 입력하세요:"
    read cloudinary_secret
    
    cat > backend/.env.production << EOF
NODE_ENV=production
PORT=5001
DATABASE_URL=${database_url}
JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_refresh_secret}
CLOUDINARY_CLOUD_NAME=${cloudinary_name}
CLOUDINARY_API_KEY=${cloudinary_key}
CLOUDINARY_API_SECRET=${cloudinary_secret}
EOF
    
    echo -e "${GREEN}✅ 백엔드 환경 변수 파일 생성 완료${NC}"
fi

if [ ! -f "frontend/.env.production" ]; then
    echo -e "${YELLOW}📝 프론트엔드 프로덕션 환경 변수 파일을 생성합니다...${NC}"
    
    echo "백엔드 도메인을 입력하세요 (예: https://your-backend.railway.app):"
    read backend_url
    
    cat > frontend/.env.production << EOF
NEXT_PUBLIC_API_URL=${backend_url}
NEXT_PUBLIC_SOCKET_URL=${backend_url}
EOF
    
    echo -e "${GREEN}✅ 프론트엔드 환경 변수 파일 생성 완료${NC}"
fi

# 3. 데이터베이스 마이그레이션 스크립트 생성
echo -e "${BLUE}🗃️  데이터베이스 마이그레이션 스크립트를 생성합니다...${NC}"

cat > migrate-production.sh << 'EOF'
#!/bin/bash

echo "🗃️ 프로덕션 데이터베이스 마이그레이션을 시작합니다..."

cd backend

# Prisma 스키마 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma db push

# 시드 데이터 실행 (선택사항)
echo "시드 데이터를 실행하시겠습니까? (y/n):"
read -p "선택: " run_seed

if [ "$run_seed" = "y" ] || [ "$run_seed" = "Y" ]; then
    npm run db:seed
    echo "✅ 시드 데이터 실행 완료"
fi

echo "✅ 데이터베이스 마이그레이션 완료"
EOF

chmod +x migrate-production.sh

# 4. 배포 전 체크리스트 생성
echo -e "${BLUE}📋 배포 전 체크리스트를 생성합니다...${NC}"

cat > deployment-checklist.md << 'EOF'
# 🚀 OpenClass 배포 전 체크리스트

## ✅ 필수 확인 사항

### 환경 변수
- [ ] DATABASE_URL 설정 (PostgreSQL)
- [ ] JWT_SECRET 및 JWT_REFRESH_SECRET 설정
- [ ] Cloudinary 인증 정보 설정
- [ ] 프론트엔드 API URL 설정

### 보안
- [ ] JWT 시크릿 키가 안전한지 확인
- [ ] 데이터베이스 비밀번호가 강력한지 확인
- [ ] API 키들이 노출되지 않았는지 확인

### 기능 테스트
- [ ] 로컬에서 빌드가 성공하는지 확인
- [ ] 로그인/회원가입 기능 테스트
- [ ] 파일 업로드 기능 테스트
- [ ] API 엔드포인트 테스트

### 배포 설정
- [ ] GitHub 저장소 연결
- [ ] CI/CD 파이프라인 설정
- [ ] 도메인 설정 (선택사항)
- [ ] SSL 인증서 설정 확인

## 📊 배포 후 확인 사항

### 백엔드
- [ ] Health check 엔드포인트 응답 확인
- [ ] 데이터베이스 연결 확인
- [ ] API 인증 동작 확인

### 프론트엔드
- [ ] 웹사이트 정상 로드 확인
- [ ] 반응형 디자인 확인
- [ ] 모든 페이지 접근 가능 확인

### 보안
- [ ] HTTPS 연결 확인
- [ ] CORS 설정 확인
- [ ] Rate limiting 동작 확인
EOF

echo -e "${GREEN}✅ 배포 환경 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${BLUE}📋 다음 단계:${NC}"
echo "1. deployment-checklist.md를 확인하고 모든 항목을 체크하세요"
echo "2. ./deploy.sh를 실행하여 배포를 시작하세요"
echo "3. 배포 후 migrate-production.sh로 데이터베이스를 설정하세요"
echo ""
echo -e "${YELLOW}⚠️  주의사항:${NC}"
echo "- 환경 변수 파일들(.env.production)은 GitHub에 커밋하지 마세요"
echo "- JWT 시크릿은 반드시 강력한 값으로 설정하세요"
echo "- 프로덕션 데이터베이스는 별도로 설정하세요"
