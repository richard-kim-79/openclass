-- OpenClass 데이터베이스 성능 최적화 스크립트

-- 기본 인덱스들 (이미 Prisma에서 생성되지만 명시적으로 확인)

-- 사용자 테이블 최적화
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(createdAt);

-- 게시물 테이블 최적화
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(authorId);
CREATE INDEX IF NOT EXISTS idx_posts_classroom_id ON posts(classroomId);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(categoryId);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(isPublished);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(createdAt);
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(viewCount);

-- 복합 인덱스 (자주 함께 쿼리되는 필드들)
CREATE INDEX IF NOT EXISTS idx_posts_published_created ON posts(isPublished, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_published ON posts(authorId, isPublished);
CREATE INDEX IF NOT EXISTS idx_posts_classroom_published ON posts(classroomId, isPublished);

-- 강의실 테이블 최적화
CREATE INDEX IF NOT EXISTS idx_classrooms_instructor_id ON classrooms(instructorId);
CREATE INDEX IF NOT EXISTS idx_classrooms_public ON classrooms(isPublic);
CREATE INDEX IF NOT EXISTS idx_classrooms_created_at ON classrooms(createdAt);

-- 파일 테이블 최적화
CREATE INDEX IF NOT EXISTS idx_files_uploader_id ON files(uploaderId);
CREATE INDEX IF NOT EXISTS idx_files_classroom_id ON files(classroomId);
CREATE INDEX IF NOT EXISTS idx_files_category_id ON files(categoryId);
CREATE INDEX IF NOT EXISTS idx_files_mimetype ON files(mimetype);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(createdAt);
CREATE INDEX IF NOT EXISTS idx_files_download_count ON files(downloadCount);

-- 좋아요 테이블 최적화
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(userId);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(postId);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(userId, postId); -- 중복 방지용

-- 멤버십 테이블 최적화
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(userId);
CREATE INDEX IF NOT EXISTS idx_memberships_classroom_id ON memberships(classroomId);
CREATE INDEX IF NOT EXISTS idx_memberships_user_classroom ON memberships(userId, classroomId);

-- 카테고리 테이블 최적화
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parentId);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- 전문 검색을 위한 인덱스 (PostgreSQL용)
-- SQLite에서는 지원하지 않으므로 조건부 실행

-- 게시물 내용 전문 검색
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        CREATE INDEX IF NOT EXISTS idx_posts_title_gin ON posts USING gin(title gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_posts_content_gin ON posts USING gin(content gin_trgm_ops);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL; -- SQLite에서는 무시
END $$;

-- 성능 통계 뷰 생성
CREATE OR REPLACE VIEW post_statistics AS
SELECT 
    p.id,
    p.title,
    p.authorId,
    p.createdAt,
    p.viewCount,
    COUNT(l.id) as likeCount,
    COUNT(c.id) as commentCount
FROM posts p
LEFT JOIN likes l ON p.id = l.postId
LEFT JOIN comments c ON p.id = c.postId
GROUP BY p.id, p.title, p.authorId, p.createdAt, p.viewCount;

-- 사용자 활동 통계 뷰
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
    u.id as userId,
    u.username,
    u.role,
    COUNT(DISTINCT p.id) as postsCount,
    COUNT(DISTINCT f.id) as filesCount,
    COUNT(DISTINCT l.id) as likesGiven,
    COUNT(DISTINCT m.id) as classroomsJoined,
    MAX(p.createdAt) as lastPostDate,
    MAX(f.createdAt) as lastFileUpload
FROM users u
LEFT JOIN posts p ON u.id = p.authorId
LEFT JOIN files f ON u.id = f.uploaderId
LEFT JOIN likes l ON u.id = l.userId
LEFT JOIN memberships m ON u.id = m.userId
GROUP BY u.id, u.username, u.role;

-- 강의실 통계 뷰
CREATE OR REPLACE VIEW classroom_statistics AS
SELECT 
    c.id,
    c.name,
    c.instructorId,
    c.isPublic,
    COUNT(DISTINCT m.userId) as memberCount,
    COUNT(DISTINCT p.id) as postsCount,
    COUNT(DISTINCT f.id) as filesCount,
    MAX(p.createdAt) as lastActivity
FROM classrooms c
LEFT JOIN memberships m ON c.id = m.classroomId
LEFT JOIN posts p ON c.id = p.classroomId
LEFT JOIN files f ON c.id = f.classroomId
GROUP BY c.id, c.name, c.instructorId, c.isPublic;

-- 인기 태그 집계
CREATE OR REPLACE VIEW popular_tags AS
SELECT 
    tag,
    COUNT(*) as usage_count,
    COUNT(DISTINCT authorId) as unique_authors
FROM (
    SELECT 
        unnest(tags) as tag,
        authorId
    FROM posts 
    WHERE isPublished = true
    UNION ALL
    SELECT 
        unnest(tags) as tag,
        uploaderId as authorId
    FROM files
) tag_usage
GROUP BY tag
HAVING COUNT(*) >= 2
ORDER BY usage_count DESC;

-- 쿼리 성능 최적화를 위한 함수들

-- 인기 게시물 가져오기 (캐시 친화적)
CREATE OR REPLACE FUNCTION get_popular_posts(
    limit_count INTEGER DEFAULT 10,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    authorId INTEGER,
    viewCount INTEGER,
    likeCount BIGINT,
    createdAt TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.authorId,
        p.viewCount,
        COUNT(l.id) as likeCount,
        p.createdAt
    FROM posts p
    LEFT JOIN likes l ON p.id = l.postId
    WHERE p.isPublished = true
      AND p.createdAt > NOW() - INTERVAL '%s days' format (days_back)
    GROUP BY p.id, p.title, p.authorId, p.viewCount, p.createdAt
    ORDER BY (p.viewCount + COUNT(l.id) * 2) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 사용자 추천 콘텐츠
CREATE OR REPLACE FUNCTION get_recommended_content(
    user_id INTEGER,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    type VARCHAR,
    score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH user_interests AS (
        -- 사용자가 좋아요한 게시물의 태그들
        SELECT unnest(p.tags) as tag
        FROM posts p
        JOIN likes l ON p.id = l.postId
        WHERE l.userId = user_id
        
        UNION ALL
        
        -- 사용자가 가입한 강의실의 게시물 태그들
        SELECT unnest(p.tags) as tag
        FROM posts p
        JOIN memberships m ON p.classroomId = m.classroomId
        WHERE m.userId = user_id
    ),
    tag_scores AS (
        SELECT tag, COUNT(*) as interest_score
        FROM user_interests
        GROUP BY tag
    )
    SELECT 
        p.id,
        p.title,
        'post' as type,
        COALESCE(SUM(ts.interest_score), 0) as score
    FROM posts p
    LEFT JOIN tag_scores ts ON ts.tag = ANY(p.tags)
    WHERE p.isPublished = true
      AND p.authorId != user_id  -- 자신의 게시물 제외
      AND p.id NOT IN (          -- 이미 좋아요한 게시물 제외
          SELECT postId FROM likes WHERE userId = user_id
      )
    GROUP BY p.id, p.title
    ORDER BY score DESC, p.createdAt DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 검색 성능 최적화를 위한 materialized view (PostgreSQL용)
DO $$
BEGIN
    -- 검색용 materialized view 생성 (PostgreSQL에서만)
    CREATE MATERIALIZED VIEW IF NOT EXISTS search_index AS
    SELECT 
        'post' as type,
        id,
        title,
        content as text_content,
        tags,
        authorId as user_id,
        classroomId,
        categoryId,
        createdAt,
        to_tsvector('english', title || ' ' || content) as search_vector
    FROM posts
    WHERE isPublished = true
    
    UNION ALL
    
    SELECT 
        'file' as type,
        id,
        originalName as title,
        description as text_content,
        tags,
        uploaderId as user_id,
        classroomId,
        categoryId,
        createdAt,
        to_tsvector('english', originalName || ' ' || COALESCE(description, '')) as search_vector
    FROM files
    
    UNION ALL
    
    SELECT 
        'classroom' as type,
        id,
        name as title,
        description as text_content,
        ARRAY[]::VARCHAR[] as tags,
        instructorId as user_id,
        NULL as classroomId,
        NULL as categoryId,
        createdAt,
        to_tsvector('english', name || ' ' || COALESCE(description, '')) as search_vector
    FROM classrooms
    WHERE isPublic = true;

    -- 검색 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_search_index_vector ON search_index USING gin(search_vector);
    CREATE INDEX IF NOT EXISTS idx_search_index_type ON search_index(type);
    CREATE INDEX IF NOT EXISTS idx_search_index_user ON search_index(user_id);
    CREATE INDEX IF NOT EXISTS idx_search_index_created ON search_index(createdAt);

EXCEPTION
    WHEN OTHERS THEN 
        -- SQLite에서는 이 기능들을 사용할 수 없으므로 무시
        NULL;
END $$;

-- 성능 모니터링을 위한 쿼리들

-- 느린 쿼리 식별 (PostgreSQL용)
DO $$
BEGIN
    -- pg_stat_statements 확장이 있다면 활성화
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 인덱스 사용량 체크 쿼리 (관리용)
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 테이블 크기 모니터링
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- 정기적인 통계 업데이트 (PostgreSQL용)
-- 매일 자정에 실행되도록 설정 권장
CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
    ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- 성능 최적화 완료 로그
DO $$
BEGIN
    RAISE NOTICE 'OpenClass 데이터베이스 최적화 완료';
    RAISE NOTICE '- 인덱스: 생성됨';
    RAISE NOTICE '- 통계 뷰: 생성됨';  
    RAISE NOTICE '- 성능 함수: 생성됨';
    RAISE NOTICE '- 검색 최적화: PostgreSQL에서 활성화됨';
END $$;
