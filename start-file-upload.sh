#!/bin/bash

echo "🚀 Cloudinary 파일 업로드 기능 설정 완료!"
echo ""

# backend 디렉토리로 이동
cd backend

echo "📦 패키지 설치 상태 확인..."
if npm list multer-storage-cloudinary >/dev/null 2>&1; then
    echo "✅ multer-storage-cloudinary 설치됨"
else
    echo "⏳ multer-storage-cloudinary 설치 중..."
    npm install multer-storage-cloudinary@^4.0.0
fi

echo ""
echo "🗄️ 데이터베이스 스키마 업데이트 중..."
npx prisma db push

echo ""
echo "✅ 설정 완료!"
echo ""
echo "🎯 이제 다음을 테스트할 수 있습니다:"
echo ""
echo "1. 📡 백엔드 서버 시작:"
echo "   cd backend && npm run dev"
echo ""
echo "2. 🌐 프론트엔드 서버 시작:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. 📁 파일 업로드 테스트:"
echo "   - http://localhost:3000/upload 접속"
echo "   - '파일 업로드' 탭 클릭"
echo "   - 파일을 드래그하거나 '파일 선택' 클릭"
echo "   - 제목 입력 후 업로드"
echo ""
echo "4. 🔧 API 엔드포인트:"
echo "   - POST http://localhost:5001/api/files/file"
echo "   - POST http://localhost:5001/api/files/image"
echo "   - GET  http://localhost:5001/api/files"
echo "   - POST http://localhost:5001/api/categories"
echo ""
echo "📊 Cloudinary 대시보드:"
echo "   https://console.cloudinary.com"
echo ""
echo "🎉 준비 완료! 파일 업로드를 테스트해보세요!"
