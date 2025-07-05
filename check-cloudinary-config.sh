#!/bin/bash

echo "🔍 Cloudinary 설정 확인 중..."

# backend 디렉토리로 이동
cd backend

# 환경 변수 확인
echo "📋 현재 환경 변수:"
echo "CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME:-'❌ 설정되지 않음'}"
echo "CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY:-'❌ 설정되지 않음'}"
echo "CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET:-'❌ 설정되지 않음'}"

echo ""
echo "🔧 .env 파일 확인:"
if [ -f ".env" ]; then
    echo "✅ .env 파일 존재"
    echo ""
    echo "📄 Cloudinary 관련 설정:"
    grep "CLOUDINARY" .env || echo "❌ Cloudinary 설정이 .env 파일에 없습니다"
else
    echo "❌ .env 파일이 없습니다"
    echo "💡 .env.example 파일을 복사하여 .env 파일을 생성하세요"
fi

echo ""
echo "📝 올바른 .env 설정 예시:"
echo "CLOUDINARY_CLOUD_NAME=your-cloud-name"
echo "CLOUDINARY_API_KEY=123456789012345"
echo "CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz"
