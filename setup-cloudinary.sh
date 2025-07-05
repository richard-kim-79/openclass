#!/bin/bash

echo "🔄 Cloudinary 파일 업로드 기능 설정 중..."

# 백엔드 디렉토리로 이동
cd backend

# 필요한 패키지 설치
echo "📦 추가 패키지 설치 중..."
npm install multer-storage-cloudinary@^4.0.0

# 데이터베이스 스키마 푸시
echo "🗄️ 데이터베이스 스키마 업데이트 중..."
npx prisma db push

# 데이터베이스 생성 확인
echo "✅ 데이터베이스 스키마 업데이트 완료"

# 프론트엔드 디렉토리로 이동
cd ../frontend

echo "🎉 Cloudinary 파일 업로드 기능 설정 완료!"
echo ""
echo "📝 다음 단계:"
echo "1. Cloudinary 계정에서 API 키를 가져와서 .env 파일을 업데이트하세요"
echo "2. backend/.env 파일에서 다음 항목을 수정하세요:"
echo "   - CLOUDINARY_CLOUD_NAME=your-actual-cloud-name"
echo "   - CLOUDINARY_API_KEY=your-actual-api-key"  
echo "   - CLOUDINARY_API_SECRET=your-actual-api-secret"
echo ""
echo "3. 개발 서버를 재시작하세요:"
echo "   - 백엔드: cd backend && npm run dev"
echo "   - 프론트엔드: cd frontend && npm run dev"
echo ""
echo "📋 새로운 기능:"
echo "✅ 파일 업로드 (이미지, 문서, 비디오, 오디오)"
echo "✅ 파일 관리 (목록, 조회, 수정, 삭제)"
echo "✅ 카테고리 시스템"
echo "✅ 실시간 업로드 진행률"
echo "✅ 파일 검증 및 크기 제한"
echo "✅ 드래그 앤 드롭 업로드"
