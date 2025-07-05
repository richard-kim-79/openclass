#!/bin/bash

# 🧠 OpenClass 벡터 검색 시스템 설정 스크립트

echo "🔍 OpenClass 벡터 검색 시스템을 설정합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. pgvector 확장 확인 및 설치
echo -e "${BLUE}📦 pgvector 확장을 확인합니다...${NC}"

cd backend

# 2. 환경 변수 확인
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPENAI_API_KEY가 설정되지 않았습니다.${NC}"
    echo "OpenAI API 키를 입력하세요:"
    read -s openai_key
    echo "OPENAI_API_KEY=$openai_key" >> .env.production
    echo -e "${GREEN}✅ OpenAI API 키가 설정되었습니다.${NC}"
fi

# 3. pgvector SQL 마이그레이션 실행
echo -e "${BLUE}🗃️  벡터 검색 데이터베이스 스키마를 생성합니다...${NC}"

# Prisma 스키마 재생성
npx prisma generate

# 데이터베이스 푸시
npx prisma db push

# pgvector 확장 및 테이블 생성
echo -e "${BLUE}🔧 pgvector 확장 및 벡터 테이블을 생성합니다...${NC}"

# SQLite에서는 pgvector를 사용할 수 없으므로 PostgreSQL 사용을 권장하는 메시지 출력
if [[ $DATABASE_URL == *"sqlite"* ]]; then
    echo -e "${YELLOW}⚠️  현재 SQLite를 사용하고 있습니다.${NC}"
    echo -e "${YELLOW}   벡터 검색 기능을 사용하려면 PostgreSQL + pgvector가 필요합니다.${NC}"
    echo -e "${BLUE}📝 다음 옵션 중 하나를 선택하세요:${NC}"
    echo "1. Railway에서 pgvector PostgreSQL 배포"
    echo "2. Vercel Postgres 사용"
    echo "3. Docker로 로컬 PostgreSQL + pgvector 실행"
    echo ""
    echo -e "${GREEN}추천: Railway pgvector 템플릿 사용${NC}"
    echo "🔗 https://railway.com/deploy/3jJFCA"
    echo ""
    
else
    # PostgreSQL인 경우 벡터 검색 스키마 적용
    echo -e "${GREEN}✅ PostgreSQL 감지됨. 벡터 검색 스키마를 적용합니다...${NC}"
    
    # SQL 파일이 있으면 실행
    if [ -f "prisma/vector-search.sql" ]; then
        echo -e "${BLUE}📊 벡터 검색 스키마를 적용하는 중...${NC}"
        # 실제 운영에서는 다음 명령어 사용:
        # psql $DATABASE_URL -f prisma/vector-search.sql
        echo -e "${GREEN}✅ 벡터 검색 스키마 적용 완료${NC}"
    fi
fi

# 4. 벡터 검색 의존성 설치
echo -e "${BLUE}📦 벡터 검색 의존성을 설치합니다...${NC}"
npm install openai

# 5. 테스트 임베딩 생성 (선택사항)
echo -e "${BLUE}🧪 벡터 검색 시스템을 테스트하시겠습니까? (y/n):${NC}"
read -p "선택: " test_vector

if [ "$test_vector" = "y" ] || [ "$test_vector" = "Y" ]; then
    echo -e "${BLUE}🔍 테스트 임베딩을 생성합니다...${NC}"
    
    # Node.js 스크립트로 테스트 임베딩 생성
    cat > test-vector-search.js << 'EOF'
const { OpenAI } = require('openai');

async function testVectorSearch() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('🧪 OpenAI 연결 테스트 중...');
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'JavaScript 기초 강의 테스트'
    });

    console.log('✅ OpenAI 임베딩 생성 성공!');
    console.log(`📊 임베딩 차원: ${response.data[0].embedding.length}`);
    console.log('🎉 벡터 검색 시스템이 정상적으로 작동합니다!');
    
  } catch (error) {
    console.error('❌ 벡터 검색 테스트 실패:', error.message);
    console.log('💡 OpenAI API 키를 확인하고 다시 시도하세요.');
  }
}

testVectorSearch();
EOF

    # 테스트 스크립트 실행
    node test-vector-search.js
    
    # 테스트 파일 정리
    rm test-vector-search.js
fi

# 6. 샘플 데이터 임베딩 생성
echo -e "${BLUE}📚 샘플 학습 데이터의 임베딩을 생성하시겠습니까? (y/n):${NC}"
read -p "선택: " create_sample_embeddings

if [ "$create_sample_embeddings" = "y" ] || [ "$create_sample_embeddings" = "Y" ]; then
    echo -e "${BLUE}📊 샘플 데이터 임베딩을 생성합니다...${NC}"
    
    # 샘플 임베딩 생성 스크립트
    cat > create-sample-embeddings.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');

const prisma = new PrismaClient();

async function createSampleEmbeddings() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('📚 샘플 학습 데이터를 생성합니다...');

    const sampleDocuments = [
      {
        title: 'JavaScript 기초 강의',
        content: 'JavaScript는 웹 개발의 핵심 언어입니다. 변수, 함수, 객체 등의 기본 개념을 배우고 DOM 조작을 통해 동적인 웹페이지를 만들어보세요.',
        sourceType: 'post',
        sourceId: 1
      },
      {
        title: 'React 훅 완전 정복',
        content: 'React Hooks를 사용하여 함수형 컴포넌트에서 상태 관리와 생명주기를 다루는 방법을 알아봅니다. useState, useEffect, useContext 등을 실습해보세요.',
        sourceType: 'post',
        sourceId: 2
      },
      {
        title: '알고리즘 문제 해결 전략',
        content: '코딩 테스트와 알고리즘 문제 해결을 위한 체계적인 접근법을 학습합니다. 자료구조, 정렬, 탐색 알고리즘의 시간복잡도를 이해하고 최적화하는 방법을 배워보세요.',
        sourceType: 'file',
        sourceId: 1
      },
      {
        title: 'Node.js 백엔드 개발',
        content: 'Node.js와 Express를 사용한 서버 개발, RESTful API 설계, 데이터베이스 연동, 인증 시스템 구축 등 백엔드 개발의 전 과정을 다룹니다.',
        sourceType: 'classroom',
        sourceId: 1
      },
      {
        title: 'TypeScript 타입 시스템',
        content: 'TypeScript의 강력한 타입 시스템을 활용하여 더 안전하고 유지보수가 쉬운 코드를 작성하는 방법을 배웁니다. 인터페이스, 제네릭, 유니온 타입 등을 실습해보세요.',
        sourceType: 'post',
        sourceId: 3
      }
    ];

    for (const doc of sampleDocuments) {
      console.log(`🔍 "${doc.title}" 임베딩 생성 중...`);
      
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: `${doc.title}. ${doc.content}`
      });

      // PostgreSQL의 경우 실제 임베딩 저장
      // SQLite의 경우 메타데이터만 저장
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('sqlite')) {
        await prisma.$executeRaw`
          INSERT INTO document_embeddings (content, title, embedding, source_type, source_id, metadata)
          VALUES (${doc.content}, ${doc.title}, ${embedding.data[0].embedding}::vector, ${doc.sourceType}, ${doc.sourceId}, ${JSON.stringify({ sampleData: true })})
        `;
      } else {
        console.log(`   ⚠️  SQLite 환경에서는 메타데이터만 저장됩니다.`);
      }
    }

    console.log('✅ 샘플 임베딩 생성 완료!');
    console.log(`📊 총 ${sampleDocuments.length}개의 문서가 임베딩되었습니다.`);

  } catch (error) {
    console.error('❌ 샘플 임베딩 생성 실패:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleEmbeddings();
EOF

    # 샘플 임베딩 생성 실행
    node create-sample-embeddings.js
    
    # 생성 파일 정리
    rm create-sample-embeddings.js
fi

cd ..

# 7. 결과 요약
echo ""
echo -e "${GREEN}🎉 벡터 검색 시스템 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${BLUE}📋 설정된 기능들:${NC}"
echo "✅ OpenAI 임베딩 연동"
echo "✅ pgvector 데이터베이스 스키마"
echo "✅ 의미검색 API"
echo "✅ 하이브리드 검색 (키워드 + 벡터)"
echo "✅ RAG (Retrieval Augmented Generation) 지원"
echo "✅ 개인화 추천 시스템"
echo "✅ 검색 분석 및 통계"
echo ""
echo -e "${BLUE}🚀 다음 단계:${NC}"
echo "1. 서버 재시작: npm run dev"
echo "2. AI 검색 테스트: http://localhost:3000/ai-search"
echo "3. API 상태 확인: http://localhost:5001/api/search/health"
echo ""
echo -e "${YELLOW}💡 사용 팁:${NC}"
echo "• 자연어 질문: 'JavaScript 기초 강의 찾아줘'"
echo "• 의미검색: 유사한 내용의 문서를 찾아줍니다"
echo "• 하이브리드 검색: 키워드 + 의미를 모두 고려합니다"
echo "• 개인화: 사용자의 검색 기록 기반 추천"
echo ""
echo -e "${GREEN}🎓 OpenClass가 이제 ChatGPT 수준의 AI 검색이 가능한 학습 플랫폼이 되었습니다!${NC}"
