#!/bin/bash

echo "🔐 OpenClass 환경 변수 설정 도우미"
echo "=================================="

# JWT 시크릿 생성
echo "📝 JWT 시크릿 키 생성 중..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo "✅ JWT 시크릿 생성 완료!"

# 환경 변수 파일 생성
cat > backend/.env << EOF
# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"

# JWT Expiration
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
EOF

echo "📋 환경 변수 파일이 생성되었습니다: backend/.env"
echo ""
echo "🔑 생성된 JWT 시크릿:"
echo "JWT_SECRET=${JWT_SECRET}"
echo "JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}"
echo ""
echo "⚠️  다음 API 키들을 수동으로 추가해야 합니다:"
echo "   - CLOUDINARY_CLOUD_NAME"
echo "   - CLOUDINARY_API_KEY" 
echo "   - CLOUDINARY_API_SECRET"
echo "   - OPENAI_API_KEY"
echo ""
echo "📖 API 키 획득 방법:"
echo "   - Cloudinary: https://cloudinary.com"
echo "   - OpenAI: https://platform.openai.com" 