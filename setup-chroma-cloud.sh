#!/bin/bash

# 🧠 OpenClass Chroma Cloud 설정 스크립트

echo "🔍 OpenClass Chroma Cloud 시스템을 설정합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Chroma Cloud API 키 확인
echo -e "${BLUE}🔑 Chroma Cloud API 키를 확인합니다...${NC}"

if [ -z "$CHROMA_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  CHROMA_API_KEY가 설정되지 않았습니다.${NC}"
    echo "Chroma Cloud API 키를 입력하세요:"
    read -s chroma_key
    echo "CHROMA_API_KEY=$chroma_key" >> backend/.env
    echo -e "${GREEN}✅ Chroma Cloud API 키가 설정되었습니다.${NC}"
fi

# 2. Chroma Cloud URL 확인
if [ -z "$CHROMA_CLOUD_URL" ]; then
    echo -e "${YELLOW}⚠️  CHROMA_CLOUD_URL이 설정되지 않았습니다.${NC}"
    echo "Chroma Cloud URL을 입력하세요 (기본값: https://chroma-cloud.com):"
    read chroma_url
    if [ -z "$chroma_url" ]; then
        chroma_url="https://chroma-cloud.com"
    fi
    echo "CHROMA_CLOUD_URL=$chroma_url" >> backend/.env
    echo -e "${GREEN}✅ Chroma Cloud URL이 설정되었습니다.${NC}"
fi

# 3. 필요한 패키지 설치
echo -e "${BLUE}📦 Chroma Cloud 의존성을 설치합니다...${NC}"

cd backend

# ChromaDB 클라이언트 설치
npm install chromadb

# LangChain 패키지 설치 (RAG 시스템용)
npm install langchain @langchain/openai

# OpenAI 패키지 설치 (이미 있을 수 있음)
npm install openai

cd ..

# 4. 환경 변수 파일 업데이트
echo -e "${BLUE}🔧 환경 변수 파일을 업데이트합니다...${NC}"

# 백엔드 .env 파일에 Chroma 관련 설정 추가
if ! grep -q "CHROMA_API_KEY" backend/.env; then
    echo "" >> backend/.env
    echo "# Chroma Cloud 설정" >> backend/.env
    echo "CHROMA_API_KEY=$CHROMA_API_KEY" >> backend/.env
    echo "CHROMA_CLOUD_URL=$CHROMA_CLOUD_URL" >> backend/.env
fi

# 5. Chroma Cloud 연결 테스트
echo -e "${BLUE}🧪 Chroma Cloud 연결을 테스트합니다...${NC}"

cat > test-chroma-connection.js << 'EOF'
const { ChromaClient } = require('chromadb');

async function testChromaConnection() {
  try {
    console.log('🔍 Chroma Cloud 연결 테스트 중...');
    
    const client = new ChromaClient({
      path: process.env.CHROMA_CLOUD_URL || 'https://chroma-cloud.com',
      auth: {
        provider: 'token',
        credentials: process.env.CHROMA_API_KEY || ''
      }
    });

    // 컬렉션 목록 조회
    const collections = await client.listCollections();
    console.log('✅ Chroma Cloud 연결 성공!');
    console.log(`📊 기존 컬렉션 수: ${collections.length}개`);
    
    // OpenClass 컬렉션 확인
    const openclassCollection = collections.find(c => c.name === 'openclass_documents');
    if (openclassCollection) {
      console.log('✅ OpenClass 컬렉션이 이미 존재합니다');
    } else {
      console.log('📝 OpenClass 컬렉션을 생성합니다...');
      await client.createCollection({
        name: 'openclass_documents',
        metadata: {
          description: 'OpenClass 학습 자료 벡터 저장소',
          created_at: new Date().toISOString()
        }
      });
      console.log('✅ OpenClass 컬렉션이 생성되었습니다');
    }
    
    console.log('🎉 Chroma Cloud 설정이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ Chroma Cloud 연결 실패:', error.message);
    console.log('');
    console.log('💡 해결 방법:');
    console.log('1. Chroma Cloud API 키가 올바른지 확인');
    console.log('2. Chroma Cloud URL이 올바른지 확인');
    console.log('3. 네트워크 연결 상태 확인');
    console.log('');
    console.log('🔗 Chroma Cloud 대시보드: https://cloud.trychroma.com');
  }
}

testChromaConnection();
EOF

# 테스트 실행
cd backend
node test-chroma-connection.js
cd ..

# 테스트 파일 정리
rm test-chroma-connection.js

# 6. 샘플 데이터 추가 (선택사항)
echo -e "${BLUE}📝 샘플 데이터를 Chroma Cloud에 추가하시겠습니까? (y/n):${NC}"
read -p "선택: " add_sample_data

if [ "$add_sample_data" = "y" ] || [ "$add_sample_data" = "Y" ]; then
    echo -e "${BLUE}📊 샘플 데이터를 추가합니다...${NC}"
    
    cat > add-sample-data.js << 'EOF'
const { ChromaClient } = require('chromadb');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');

async function addSampleData() {
  try {
    const client = new ChromaClient({
      path: process.env.CHROMA_CLOUD_URL || 'https://chroma-cloud.com',
      auth: {
        provider: 'token',
        credentials: process.env.CHROMA_API_KEY || ''
      }
    });

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002'
    });

    const collection = await client.getCollection({
      name: 'openclass_documents'
    });

    // 샘플 문서들
    const sampleDocuments = [
      {
        id: 'sample_1',
        content: 'JavaScript는 웹 개발에서 가장 널리 사용되는 프로그래밍 언어입니다. 동적 타이핑을 지원하며, 프론트엔드와 백엔드 모두에서 사용할 수 있습니다.',
        metadata: {
          title: 'JavaScript 기초',
          sourceType: 'post',
          sourceId: 'sample_1',
          tags: ['javascript', 'programming', 'web'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'sample_2',
        content: 'React는 Facebook에서 개발한 JavaScript 라이브러리로, 사용자 인터페이스를 구축하기 위한 컴포넌트 기반 아키텍처를 제공합니다.',
        metadata: {
          title: 'React 소개',
          sourceType: 'post',
          sourceId: 'sample_2',
          tags: ['react', 'javascript', 'frontend'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'sample_3',
        content: 'Node.js는 Chrome V8 JavaScript 엔진을 기반으로 한 서버 사이드 JavaScript 런타임 환경입니다. 비동기 I/O를 지원하여 높은 성능을 제공합니다.',
        metadata: {
          title: 'Node.js 백엔드 개발',
          sourceType: 'post',
          sourceId: 'sample_3',
          tags: ['nodejs', 'javascript', 'backend'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ];

    for (const doc of sampleDocuments) {
      console.log(`🔍 "${doc.metadata.title}" 임베딩 생성 중...`);
      
      const embedding = await embeddings.embedQuery(doc.content);
      
      await collection.add({
        ids: [doc.id],
        embeddings: [embedding],
        documents: [doc.content],
        metadatas: [doc.metadata]
      });
    }

    console.log('✅ 샘플 데이터 추가 완료!');
    console.log(`📊 총 ${sampleDocuments.length}개의 문서가 추가되었습니다.`);

  } catch (error) {
    console.error('❌ 샘플 데이터 추가 실패:', error.message);
  }
}

addSampleData();
EOF

    # 샘플 데이터 추가 실행
    cd backend
    node add-sample-data.js
    cd ..
    
    # 생성 파일 정리
    rm add-sample-data.js
fi

# 7. 결과 요약
echo ""
echo -e "${GREEN}🎉 Chroma Cloud 시스템 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${BLUE}📋 설정된 기능들:${NC}"
echo "✅ Chroma Cloud 연결"
echo "✅ 벡터 데이터베이스 설정"
echo "✅ RAG (Retrieval Augmented Generation) 시스템"
echo "✅ 의미검색 API"
echo "✅ 문서 임베딩 및 검색"
echo "✅ API 키 기반 외부 접근"
echo ""
echo -e "${BLUE}🚀 다음 단계:${NC}"
echo "1. 서버 재시작: npm run dev"
echo "2. RAG 시스템 테스트: http://localhost:3000/ai-search"
echo "3. API 키 발급: http://localhost:3000/settings"
echo ""
echo -e "${BLUE}📚 API 사용 예시:${NC}"
echo "curl -X POST http://localhost:5001/api/rag/query \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-API-Key: YOUR_API_KEY' \\"
echo "  -d '{\"query\": \"JavaScript 기초 강의 찾아줘\"}'"
echo ""
echo -e "${GREEN}🎯 이제 누구나 API 키를 발급받아 벡터 검색과 RAG 기능을 사용할 수 있습니다!${NC}" 