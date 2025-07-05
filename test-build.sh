#!/bin/bash

# 🏗️ OpenClass 빌드 테스트 스크립트

echo "🏗️ OpenClass 빌드 테스트를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BUILD_SUCCESS=true

# 1. 백엔드 빌드 테스트
echo -e "${BLUE}🔧 백엔드 빌드 테스트 중...${NC}"
cd backend

if npm run build; then
    echo -e "${GREEN}✅ 백엔드 빌드 성공${NC}"
else
    echo -e "${RED}❌ 백엔드 빌드 실패${NC}"
    BUILD_SUCCESS=false
fi

cd ..

# 2. 프론트엔드 빌드 테스트
echo -e "${BLUE}🎨 프론트엔드 빌드 테스트 중...${NC}"
cd frontend

if npm run build; then
    echo -e "${GREEN}✅ 프론트엔드 빌드 성공${NC}"
else
    echo -e "${RED}❌ 프론트엔드 빌드 실패${NC}"
    BUILD_SUCCESS=false
fi

cd ..

# 결과 출력
if [ "$BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 모든 빌드가 성공했습니다!${NC}"
    echo -e "${YELLOW}🚀 배포 준비가 완료되었습니다.${NC}"
    exit 0
else
    echo -e "${RED}❌ 일부 빌드가 실패했습니다.${NC}"
    echo -e "${YELLOW}🔧 오류를 수정한 후 다시 시도하세요.${NC}"
    exit 1
fi
