#!/bin/bash

# 🔍 OpenClass 코드 품질 및 배포 준비성 종합 검사

echo "🎯 OpenClass 최종 품질 검사를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 검사 결과 저장
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# 검사 함수
check_item() {
    local description="$1"
    local command="$2"
    local is_critical="$3"  # true/false
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${CYAN}🔍 검사 중: ${description}${NC}"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 통과: ${description}${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        if [ "$is_critical" = "true" ]; then
            echo -e "${RED}❌ 실패: ${description}${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        else
            echo -e "${YELLOW}⚠️  경고: ${description}${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  OpenClass 코드 품질 종합 검사 시작${NC}"
echo -e "${BLUE}================================================${NC}"

# 1. 프로젝트 구조 검사
echo -e "\n${PURPLE}📁 1. 프로젝트 구조 검사${NC}"

check_item "package.json 존재 확인" "test -f package.json" true
check_item "backend 폴더 존재 확인" "test -d backend" true
check_item "frontend 폴더 존재 확인" "test -d frontend" true
check_item "shared 폴더 존재 확인" "test -d shared" true
check_item "환경 변수 예시 파일 존재" "test -f .env.example" true
check_item "README.md 존재 확인" "test -f README.md" true
check_item "배포 설정 파일들 존재" "test -f docker-compose.yml && test -f railway.toml && test -f vercel.json" true

# 2. 의존성 및 패키지 검사
echo -e "\n${PURPLE}📦 2. 의존성 및 패키지 검사${NC}"

check_item "루트 node_modules 존재" "test -d node_modules" false
check_item "백엔드 의존성 설치됨" "test -d backend/node_modules" true
check_item "프론트엔드 의존성 설치됨" "test -d frontend/node_modules" true
check_item "패키지 잠금 파일 존재" "test -f package-lock.json" false

# 3. TypeScript 설정 검사
echo -e "\n${PURPLE}🧪 3. TypeScript 설정 검사${NC}"

check_item "백엔드 TypeScript 설정" "test -f backend/tsconfig.json" true
check_item "프론트엔드 TypeScript 설정" "test -f frontend/tsconfig.json" true
check_item "공유 타입 정의" "test -f shared/types.ts" true

# 4. 코드 품질 검사
echo -e "\n${PURPLE}🔍 4. 코드 품질 검사${NC}"

check_item "ESLint 설정 (백엔드)" "test -f backend/.eslintrc.json" true
check_item "ESLint 설정 (프론트엔드)" "test -f frontend/.eslintrc.json" true
check_item "Prettier 설정" "test -f .prettierrc.json" true

# 백엔드 타입 체크
if cd backend && npm run type-check > /dev/null 2>&1; then
    check_item "백엔드 TypeScript 타입 체크" "true" true
else
    check_item "백엔드 TypeScript 타입 체크" "false" true
fi
cd ..

# 프론트엔드 타입 체크
if cd frontend && npm run type-check > /dev/null 2>&1; then
    check_item "프론트엔드 TypeScript 타입 체크" "true" true
else
    check_item "프론트엔드 TypeScript 타입 체크" "false" true
fi
cd ..

# 5. 보안 검사
echo -e "\n${PURPLE}🔒 5. 보안 검사${NC}"

check_item "보안 설정 파일 존재" "test -f backend/src/config/security.ts" true
check_item "환경 변수 검증 로직 존재" "grep -q 'validateEnvironment' backend/src/config/security.ts" true
check_item ".gitignore에 환경 변수 제외" "grep -q '.env' .gitignore" true
check_item "JWT 시크릿 환경 변수 설정" "grep -q 'JWT_SECRET' .env.example" true

# 6. 데이터베이스 검사
echo -e "\n${PURPLE}🗃️  6. 데이터베이스 검사${NC}"

check_item "Prisma 스키마 존재" "test -f backend/prisma/schema.prisma" true
check_item "벡터 검색 SQL 스크립트" "test -f backend/prisma/vector-search.sql" true
check_item "데이터베이스 최적화 스크립트" "test -f backend/prisma/optimize-database.sql" true
check_item "시드 데이터 스크립트" "test -f backend/prisma/seed.ts" false

# 7. API 및 라우트 검사
echo -e "\n${PURPLE}🌐 7. API 및 라우트 검사${NC}"

check_item "인증 라우트 존재" "test -f backend/src/routes/auth.ts" true
check_item "검색 라우트 존재" "test -f backend/src/routes/search.ts" true
check_item "벡터 검색 서비스" "test -f backend/src/services/vectorSearch.ts" true
check_item "에러 핸들러 미들웨어" "test -f backend/src/middleware/errorHandler.ts" true
check_item "로깅 유틸리티" "test -f backend/src/utils/logger.ts" true

# 8. 프론트엔드 컴포넌트 검사
echo -e "\n${PURPLE}🎨 8. 프론트엔드 컴포넌트 검사${NC}"

check_item "AI 검색 페이지" "test -f frontend/app/ai-search/page.tsx" true
check_item "접근성 유틸리티" "test -f frontend/lib/accessibility.tsx" true
check_item "인증 훅" "test -f frontend/hooks/useAuth.ts" false

# 9. 벡터 검색 시스템 검사
echo -e "\n${PURPLE}🧠 9. 벡터 검색 시스템 검사${NC}"

check_item "벡터 검색 설정 스크립트" "test -f setup-vector-search.sh" true
check_item "OpenAI 서비스 통합" "grep -q 'openai' backend/package.json" true
check_item "벡터 검색 API 엔드포인트" "grep -q '/api/search' backend/src/index.ts" true

# 10. 배포 준비성 검사
echo -e "\n${PURPLE}🚀 10. 배포 준비성 검사${NC}"

check_item "Docker 설정 파일들" "test -f Dockerfile.backend && test -f Dockerfile.frontend" true
check_item "Docker Compose 설정" "test -f docker-compose.yml" true
check_item "GitHub Actions 워크플로우" "test -f .github/workflows/deploy.yml" true
check_item "Railway 배포 설정" "test -f railway.toml" true
check_item "Vercel 배포 설정" "test -f vercel.json" true
check_item "배포 스크립트" "test -f deploy.sh" true

# 11. 문서화 검사
echo -e "\n${PURPLE}📚 11. 문서화 검사${NC}"

check_item "README.md 완성도" "wc -l README.md | awk '{print \$1}' | grep -E '^[1-9][0-9]+\$'" true
check_item "설치 가이드" "test -f INSTALLATION_GUIDE.md" true
check_item "개발 상태 문서" "test -f DEVELOPMENT_STATUS.md" true
check_item "배포 가이드" "test -f DEPLOY.md" true

# 12. 성능 최적화 검사
echo -e "\n${PURPLE}⚡ 12. 성능 최적화 검사${NC}"

check_item "성능 최적화 유틸리티" "test -f backend/src/utils/performance.ts" true
check_item "캐싱 미들웨어 구현" "grep -q 'cacheMiddleware' backend/src/utils/performance.ts" true
check_item "압축 설정" "grep -q 'compression' backend/src/index.ts" false

# 13. 스크립트 및 자동화 검사
echo -e "\n${PURPLE}🔧 13. 스크립트 및 자동화 검사${NC}"

check_item "서버 시작 스크립트" "test -f start-servers.sh" false
check_item "API 테스트 스크립트" "test -f test-api.sh" false
check_item "배포 설정 스크립트" "test -f setup-deployment.sh" true

# 14. 빌드 테스트
echo -e "\n${PURPLE}🏗️  14. 빌드 테스트${NC}"

echo -e "${CYAN}🔍 백엔드 빌드 테스트 중...${NC}"
if cd backend && npm run build > build.log 2>&1; then
    check_item "백엔드 빌드 성공" "true" true
    rm -f build.log
else
    check_item "백엔드 빌드 성공" "false" true
    echo -e "${RED}백엔드 빌드 로그:${NC}"
    tail -10 build.log
    rm -f build.log
fi
cd ..

echo -e "${CYAN}🔍 프론트엔드 빌드 테스트 중...${NC}"
if cd frontend && npm run build > build.log 2>&1; then
    check_item "프론트엔드 빌드 성공" "true" true
    rm -f build.log
else
    check_item "프론트엔드 빌드 성공" "false" true
    echo -e "${RED}프론트엔드 빌드 로그:${NC}"
    tail -10 build.log
    rm -f build.log
fi
cd ..

# 15. 최종 점검
echo -e "\n${PURPLE}🎯 15. 최종 점검${NC}"

# 전체적인 구조 검증
check_item "모노레포 구조 완성도" "test -d backend && test -d frontend && test -d shared" true
check_item "CI/CD 파이프라인 준비" "test -f .github/workflows/deploy.yml" true
check_item "환경별 설정 완료" "test -f .env.example && test -f railway.toml && test -f vercel.json" true

# 결과 요약 출력
echo -e "\n${BLUE}================================================${NC}"
echo -e "${BLUE}           코드 품질 검사 결과 요약${NC}"
echo -e "${BLUE}================================================${NC}"

echo -e "\n📊 ${CYAN}검사 통계:${NC}"
echo -e "   ${GREEN}✅ 통과: ${PASSED_CHECKS}${NC}"
echo -e "   ${RED}❌ 실패: ${FAILED_CHECKS}${NC}"
echo -e "   ${YELLOW}⚠️  경고: ${WARNINGS}${NC}"
echo -e "   📋 전체: ${TOTAL_CHECKS}"

# 성공률 계산
SUCCESS_RATE=$(echo "scale=1; $PASSED_CHECKS * 100 / $TOTAL_CHECKS" | bc)

echo -e "\n🎯 ${CYAN}성공률: ${SUCCESS_RATE}%${NC}"

# 배포 준비성 평가
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 축하합니다! 모든 중요 검사를 통과했습니다.${NC}"
    echo -e "${GREEN}✨ OpenClass는 배포 준비가 완료되었습니다!${NC}"
    DEPLOY_READY=true
elif [ $FAILED_CHECKS -le 2 ]; then
    echo -e "\n${YELLOW}⚠️  일부 문제가 있지만 배포 가능한 상태입니다.${NC}"
    echo -e "${YELLOW}🔧 실패한 항목들을 수정 후 배포하는 것을 권장합니다.${NC}"
    DEPLOY_READY=true
else
    echo -e "\n${RED}❌ 배포 전 수정이 필요한 문제들이 있습니다.${NC}"
    echo -e "${RED}🛠️  실패한 항목들을 먼저 해결해주세요.${NC}"
    DEPLOY_READY=false
fi

# 추천 다음 단계
echo -e "\n${PURPLE}📋 추천 다음 단계:${NC}"

if [ $DEPLOY_READY = true ]; then
    echo -e "${GREEN}1. 환경 변수 설정:${NC}"
    echo -e "   ./setup-deployment.sh"
    echo -e "${GREEN}2. 벡터 검색 시스템 설정:${NC}"
    echo -e "   ./setup-vector-search.sh"
    echo -e "${GREEN}3. 배포 실행:${NC}"
    echo -e "   ./deploy.sh"
    echo -e "${GREEN}4. 배포 확인:${NC}"
    echo -e "   - 프론트엔드: https://your-app.vercel.app"
    echo -e "   - 백엔드: https://your-backend.railway.app"
else
    echo -e "${YELLOW}1. 실패한 검사 항목들 수정${NC}"
    echo -e "${YELLOW}2. 다시 품질 검사 실행:${NC}"
    echo -e "   ./quality-check.sh"
    echo -e "${YELLOW}3. 모든 검사 통과 후 배포 진행${NC}"
fi

# 품질 개선 제안
echo -e "\n${PURPLE}💡 품질 개선 제안:${NC}"
echo -e "• 단위 테스트 추가 (Jest)"
echo -e "• E2E 테스트 추가 (Playwright)"
echo -e "• 코드 커버리지 측정"
echo -e "• 성능 모니터링 도구 연동"
echo -e "• 보안 스캔 자동화"

# 최종 메시지
echo -e "\n${BLUE}================================================${NC}"
if [ $DEPLOY_READY = true ]; then
    echo -e "${GREEN}🚀 OpenClass 배포 준비 완료! 성공적인 배포를 기원합니다! ${NC}"
else
    echo -e "${YELLOW}🔧 조금만 더 수정하면 완벽한 OpenClass가 됩니다! ${NC}"
fi
echo -e "${BLUE}================================================${NC}"

# 결과에 따른 exit code
if [ $FAILED_CHECKS -eq 0 ]; then
    exit 0
else
    exit 1
fi
