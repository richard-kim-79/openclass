-- OpenClass Vector Search Extension
-- pgvector를 활용한 의미검색 지원

-- pgvector 확장 추가
CREATE EXTENSION IF NOT EXISTS vector;

-- 문서 임베딩 테이블
CREATE TABLE document_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  title VARCHAR(255),
  embedding vector(1536), -- OpenAI text-embedding-ada-002 차원
  metadata JSONB DEFAULT '{}',
  source_type VARCHAR(50), -- 'post', 'file', 'classroom' 등
  source_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 기존 테이블에 임베딩 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_embedding vector(1536);
ALTER TABLE files ADD COLUMN IF NOT EXISTS content_embedding vector(1536);
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS description_embedding vector(1536);

-- 벡터 유사도 검색을 위한 인덱스
-- IVFFlat 인덱스 (기본)
CREATE INDEX IF NOT EXISTS document_embeddings_idx 
ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- HNSW 인덱스 (고성능)
CREATE INDEX IF NOT EXISTS document_embeddings_hnsw_idx 
ON document_embeddings 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- 기존 테이블 인덱스
CREATE INDEX IF NOT EXISTS posts_embedding_idx 
ON posts 
USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX IF NOT EXISTS files_embedding_idx 
ON files 
USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 50);

-- 하이브리드 검색을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS document_embeddings_hybrid_idx 
ON document_embeddings (source_type, created_at DESC);

-- 메타데이터 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS document_embeddings_metadata_idx 
ON document_embeddings USING gin (metadata);

-- 벡터 검색 함수들
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS float AS $$
BEGIN
  RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- 의미검색 함수
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  result_limit int DEFAULT 10,
  source_filter text DEFAULT NULL
)
RETURNS TABLE (
  id int,
  content text,
  title varchar,
  similarity float,
  source_type varchar,
  source_id int,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.content,
    de.title,
    cosine_similarity(de.embedding, query_embedding) as similarity,
    de.source_type,
    de.source_id,
    de.metadata
  FROM document_embeddings de
  WHERE 
    (source_filter IS NULL OR de.source_type = source_filter)
    AND cosine_similarity(de.embedding, query_embedding) >= similarity_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- 하이브리드 검색 함수 (키워드 + 벡터)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(1536),
  keyword_weight float DEFAULT 0.3,
  vector_weight float DEFAULT 0.7,
  result_limit int DEFAULT 10
)
RETURNS TABLE (
  id int,
  content text,
  title varchar,
  combined_score float,
  keyword_score float,
  vector_score float,
  source_type varchar,
  source_id int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.content,
    de.title,
    (keyword_weight * ts_rank(to_tsvector('english', de.content), plainto_tsquery('english', query_text)) + 
     vector_weight * cosine_similarity(de.embedding, query_embedding)) as combined_score,
    ts_rank(to_tsvector('english', de.content), plainto_tsquery('english', query_text)) as keyword_score,
    cosine_similarity(de.embedding, query_embedding) as vector_score,
    de.source_type,
    de.source_id
  FROM document_embeddings de
  WHERE 
    to_tsvector('english', de.content) @@ plainto_tsquery('english', query_text)
    OR cosine_similarity(de.embedding, query_embedding) > 0.5
  ORDER BY combined_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- 임베딩 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_content_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- 실제 임베딩은 애플리케이션에서 처리하고 여기서는 타임스탬프만 업데이트
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER document_embeddings_update_trigger
  BEFORE UPDATE ON document_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_content_embedding();

-- 전문 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS document_embeddings_content_fts_idx 
ON document_embeddings 
USING gin (to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS document_embeddings_title_fts_idx 
ON document_embeddings 
USING gin (to_tsvector('english', title));

-- 검색 통계 테이블
CREATE TABLE IF NOT EXISTS search_analytics (
  id SERIAL PRIMARY KEY,
  query_text TEXT,
  query_embedding vector(1536),
  results_count INTEGER,
  user_id INTEGER REFERENCES users(id),
  search_type VARCHAR(50), -- 'semantic', 'keyword', 'hybrid'
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 검색 통계 인덱스
CREATE INDEX IF NOT EXISTS search_analytics_user_idx ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS search_analytics_created_at_idx ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS search_analytics_type_idx ON search_analytics(search_type);

-- 추천 시스템을 위한 사용자 선호도 벡터 테이블
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  preference_embedding vector(1536),
  topics_of_interest JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_preferences_user_idx ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS user_preferences_embedding_idx 
ON user_preferences 
USING ivfflat (preference_embedding vector_cosine_ops) WITH (lists = 20);

COMMENT ON TABLE document_embeddings IS 'OpenClass 의미검색을 위한 문서 임베딩 저장소';
COMMENT ON COLUMN document_embeddings.embedding IS 'OpenAI text-embedding-ada-002 모델 기반 1536차원 벡터';
COMMENT ON FUNCTION semantic_search IS 'OpenClass 의미검색 함수 - 자연어 쿼리 기반 유사 문서 검색';
COMMENT ON FUNCTION hybrid_search IS 'OpenClass 하이브리드 검색 - 키워드와 의미검색 결합';
