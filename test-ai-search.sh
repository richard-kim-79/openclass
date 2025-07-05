#!/bin/bash

echo "🤖 OpenClass AI 검색 백엔드 테스트"
echo "=================================="

BASE_URL="http://localhost:5001"

echo "1. 서버 상태 확인..."
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/health"

echo -e "\n2. AI 검색 테스트 - 기본 검색..."
curl -s -X POST "$BASE_URL/api/ai-search/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "JavaScript", "type": "ALL", "limit": 5}' \
  | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/api/ai-search/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "JavaScript", "type": "ALL", "limit": 5}'

echo -e "\n3. AI 검색 테스트 - 질문 형식..."
curl -s -X POST "$BASE_URL/api/ai-search/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "React는 무엇인가요?", "type": "POST", "includeAISummary": true}' \
  | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/api/ai-search/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "React는 무엇인가요?", "type": "POST", "includeAISummary": true}'

echo -e "\n4. 검색 제안 테스트..."
curl -s "$BASE_URL/api/ai-search/suggestions?query=Python" \
  | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/ai-search/suggestions?query=Python"

echo -e "\n5. 인기 검색어 조회..."
curl -s "$BASE_URL/api/ai-search/popular" \
  | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/ai-search/popular"

echo -e "\n6. 자동 태그 생성 테스트 (인증 필요)..."
echo "Note: 이 테스트는 로그인 토큰이 필요합니다."

echo -e "\n✅ AI 검색 백엔드 테스트 완료!"
echo -e "\n📝 참고사항:"
echo "- OpenAI API 키가 설정되지 않은 경우 기본 검색 기능만 사용됩니다"
echo "- AI 요약 및 태그 생성은 OpenAI API 키가 필요합니다"
echo "- Rate Limiting이 적용되어 분당 10회로 제한됩니다"
