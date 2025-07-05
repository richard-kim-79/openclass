#!/bin/bash

echo "🧪 OpenClass API 테스트 스크립트"
echo "================================"

BASE_URL="http://localhost:5001"

echo "1. 서버 상태 확인..."
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/health"

echo -e "\n2. 데이터베이스 상태 확인..."
curl -s "$BASE_URL/db-status" | jq '.' 2>/dev/null || curl -s "$BASE_URL/db-status"

echo -e "\n3. 사용자 목록 확인..."
curl -s "$BASE_URL/api/users" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/users"

echo -e "\n4. 강의실 목록 확인..."
curl -s "$BASE_URL/api/classrooms" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/classrooms"

echo -e "\n5. 게시물 목록 확인..."
curl -s "$BASE_URL/api/posts" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/posts"

echo -e "\n✅ API 테스트 완료!"
echo "🌐 프론트엔드 주소: http://localhost:3000"
echo "🔧 백엔드 주소: http://localhost:5001"
