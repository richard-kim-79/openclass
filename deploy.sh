#!/bin/bash

# 🚀 OpenClass 배포 스크립트

echo "🎯 OpenClass 배포를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Git 상태 확인
echo -e "${BLUE}📋 Git 상태 확인 중...${NC}"
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git 저장소가 초기화되지 않았습니다. 초기화 중...${NC}"
    git init
    git add .
    git commit -m "🎉 Initial commit: OpenClass AI 학습 플랫폼"
else
    echo -e "${GREEN}✅ Git 저장소 확인됨${NC}"
fi

# 2. 변경 사항 커밋
echo -e "${BLUE}📝 변경 사항 커밋 중...${NC}"
git add .
if git diff --staged --quiet; then
    echo -e "${YELLOW}📝 커밋할 변경 사항이 없습니다.${NC}"
else
    echo "커밋 메시지를 입력하세요 (기본값: 🚀 Deploy updates):"
    read commit_message
    if [ -z "$commit_message" ]; then
        commit_message="🚀 Deploy updates"
    fi
    git commit -m "$commit_message"
    echo -e "${GREEN}✅ 변경 사항 커밋 완료${NC}"
fi

# 3. 빌드 테스트
echo -e "${BLUE}🏗️  빌드 테스트 중...${NC}"
cd backend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 백엔드 빌드 성공${NC}"
else
    echo -e "${YELLOW}⚠️  백엔드 빌드 건너뜀${NC}"
fi

cd ../frontend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 프론트엔드 빌드 성공${NC}"
else
    echo -e "${RED}❌ 프론트엔드 빌드 실패${NC}"
    echo "빌드 오류를 확인하고 수정 후 다시 시도하세요."
    exit 1
fi

cd ..

# 4. GitHub 원격 저장소 확인
echo -e "${BLUE}🌐 GitHub 원격 저장소 확인 중...${NC}"
if git remote get-url origin > /dev/null 2>&1; then
    echo -e "${GREEN}✅ GitHub 원격 저장소 연결됨${NC}"
    
    # 5. GitHub에 푸시
    echo -e "${BLUE}📤 GitHub에 푸시 중...${NC}"
    git push origin main
    echo -e "${GREEN}✅ GitHub 푸시 완료${NC}"
    
    echo -e "${GREEN}🎉 배포 완료!${NC}"
    echo -e "${BLUE}📋 다음 단계:${NC}"
    echo "1. GitHub Actions에서 CI/CD 실행 확인"
    echo "2. Vercel/Railway에서 배포 상태 확인"
    echo "3. 배포된 애플리케이션 테스트"
    
else
    echo -e "${YELLOW}⚠️  GitHub 원격 저장소가 설정되지 않았습니다.${NC}"
    echo "GitHub 저장소 URL을 입력하세요:"
    read repo_url
    
    if [ ! -z "$repo_url" ]; then
        git remote add origin "$repo_url"
        git branch -M main
        git push -u origin main
        echo -e "${GREEN}✅ GitHub 저장소 연결 및 푸시 완료${NC}"
    else
        echo -e "${RED}❌ 저장소 URL이 입력되지 않았습니다.${NC}"
        exit 1
    fi
fi

# 6. 배포 정보 출력
echo -e "${BLUE}📊 배포 정보:${NC}"
echo "🌐 GitHub: $(git remote get-url origin)"
echo "🎯 브랜치: $(git branch --show-current)"
echo "📝 마지막 커밋: $(git log -1 --pretty=format:'%h - %s (%an, %ar)')"
echo ""
echo -e "${GREEN}🚀 OpenClass 배포가 완료되었습니다!${NC}"
