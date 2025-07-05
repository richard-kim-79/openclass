#!/bin/bash

# 🔧 OpenClass 의존성 자동 설치 스크립트

echo "📦 OpenClass 의존성을 설치합니다..."

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 루트 의존성 설치
echo -e "${BLUE}📦 루트 의존성 설치 중...${NC}"
npm install

# 2. 백엔드 의존성 설치
echo -e "${BLUE}📦 백엔드 의존성 설치 중...${NC}"
cd backend
npm install

# 3. 프론트엔드 의존성 설치
echo -e "${BLUE}📦 프론트엔드 의존성 설치 중...${NC}"
cd ../frontend
npm install

# 4. 루트로 돌아가기
cd ..

echo -e "${GREEN}✅ 모든 의존성 설치가 완료되었습니다!${NC}"
echo -e "${YELLOW}🔧 이제 품질 검사를 다시 실행하세요: ./quality-check.sh${NC}"
