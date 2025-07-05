# OpenClass API 문서

## 🔗 베이스 URL
- **개발 환경**: `http://localhost:5001`
- **운영 환경**: `https://your-domain.com`

## 🔐 인증

### JWT 토큰 인증
모든 보호된 API는 JWT 토큰을 사용합니다.

#### 헤더 형식
```
Authorization: Bearer <access_token>
```

### API 키 인증 (외부 접근용)
외부 애플리케이션에서 사용할 수 있는 API 키 인증을 지원합니다.

#### 헤더 형식
```
X-API-Key: <api_key>
```

또는 쿼리 파라미터
```
?apiKey=<api_key>
```

## 📋 API 엔드포인트

### 🔑 API 키 관리 (API Key Management)

#### API 키 발급
```http
POST /api/apikey/generate
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "message": "API 키가 성공적으로 발급되었습니다",
  "data": {
    "apiKey": "ok_1703123456789_abc123def",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### API 키 재발급
```http
POST /api/apikey/regenerate
Authorization: Bearer <access_token>
```

#### API 키 조회
```http
GET /api/apikey
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "apiKey": "ok_1703123456789_abc123def",
    "subscription": "free",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "usage": {
      "totalCalls": 156,
      "todayCalls": 12,
      "monthlyCalls": 156,
      "limit": 1000
    }
  }
}
```

#### API 키 삭제
```http
DELETE /api/apikey
Authorization: Bearer <access_token>
```

### 🧠 RAG 시스템 (Retrieval Augmented Generation)

#### RAG 기반 질의응답
```http
POST /api/rag/query
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "query": "JavaScript 기초 강의 찾아줘",
  "maxTokens": 1000,
  "temperature": 0.7,
  "includeSources": true
}
```

**외부 API 접근:**
```http
POST /api/rag/query/api
Content-Type: application/json
X-API-Key: <api_key>

{
  "query": "JavaScript 기초 강의 찾아줘"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "answer": "JavaScript는 웹 개발에서 가장 널리 사용되는 프로그래밍 언어입니다...",
    "sources": [
      {
        "id": "post_123",
        "title": "JavaScript 기초 강의",
        "content": "JavaScript는 동적 타이핑을 지원하는...",
        "score": 0.95
      }
    ],
    "context": "JavaScript 기초 강의: JavaScript는 동적 타이핑을 지원하는...",
    "tokenCount": 245,
    "processingTime": 1250
  }
}
```

#### 벡터 검색
```http
POST /api/rag/search
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "query": "React 컴포넌트",
  "limit": 10,
  "threshold": 0.6,
  "filter": {
    "sourceType": "post"
  }
}
```

**외부 API 접근:**
```http
POST /api/rag/search/api
Content-Type: application/json
X-API-Key: <api_key>

{
  "query": "React 컴포넌트"
}
```

#### 문서 추가
```http
POST /api/rag/documents
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "content": "React는 Facebook에서 개발한 JavaScript 라이브러리입니다...",
  "title": "React 소개",
  "sourceType": "post",
  "sourceId": "123",
  "tags": ["react", "javascript", "frontend"]
}
```

#### 유사 문서 찾기
```http
POST /api/rag/similar
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "documentId": "post_123",
  "limit": 5
}
```

#### 벡터 DB 통계
```http
GET /api/rag/stats
Authorization: Bearer <access_token>
```

#### 데이터 마이그레이션
```http
POST /api/rag/migrate
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "sourceType": "posts"
}
```

### 🔐 인증 (Authentication)

#### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "홍길동"
}
```

**응답:**
```json
{
  "success": true,
  "message": "회원가입이 성공적으로 완료되었습니다",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "홍길동",
      "role": "student"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

#### 로그아웃
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

#### 내 정보 조회
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### 토큰 갱신
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}
```

### 🤖 AI 검색 (AI Search)

#### AI 검색 수행
```http
POST /api/ai-search/search
Content-Type: application/json

{
  "query": "JavaScript 기초 강의 찾아줘",
  "type": "ALL",
  "limit": 10,
  "includeAISummary": true
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "query": "JavaScript 기초 강의 찾아줘",
    "results": [
      {
        "id": "result_id",
        "title": "JavaScript 기초 강의",
        "description": "초보자를 위한 JavaScript 기초 강의",
        "type": "FILE",
        "url": "https://example.com/file.pdf",
        "relevanceScore": 0.95,
        "aiSummary": "JavaScript의 기본 문법과 개념을 설명하는 강의자료입니다.",
        "tags": ["JavaScript", "기초", "강의"],
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 1,
    "searchTime": "2024-01-15T10:00:00Z"
  }
}
```

#### 검색 제안
```http
GET /api/ai-search/suggestions?query=Java
```

#### 자동 태그 생성
```http
POST /api/ai-search/auto-tags
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "이 문서는 JavaScript의 기초 개념을 설명합니다..."
}
```

#### 인기 검색어
```http
GET /api/ai-search/popular
```

### 💬 채팅 (Chat)

#### 메시지 생성
```http
POST /api/chat/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "안녕하세요!",
  "classroomId": "classroom_id",
  "type": "text"
}
```

#### 메시지 목록 조회
```http
GET /api/chat/messages/:classroomId?limit=50&before=2024-01-15T10:00:00Z
Authorization: Bearer <access_token>
```

#### 메시지 수정
```http
PUT /api/chat/messages/:messageId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "수정된 메시지 내용"
}
```

#### 메시지 삭제
```http
DELETE /api/chat/messages/:messageId
Authorization: Bearer <access_token>
```

#### 메시지 읽음 처리
```http
POST /api/chat/messages/:messageId/read
Authorization: Bearer <access_token>
```

#### 메시지 반응 토글
```http
POST /api/chat/messages/:messageId/reaction
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "emoji": "👍"
}
```

#### 온라인 사용자 목록
```http
GET /api/chat/classrooms/:classroomId/users
Authorization: Bearer <access_token>
```

### 👤 프로필 (Profile)

#### 내 프로필 조회
```http
GET /api/profile/me
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "홍길동",
      "bio": "안녕하세요! 개발자입니다.",
      "avatarUrl": "https://example.com/avatar.jpg",
      "role": "student",
      "stats": {
        "postsCount": 15,
        "likesReceived": 42,
        "classroomsJoined": 5,
        "filesCount": 8
      }
    }
  }
}
```

#### 내 활동 조회
```http
GET /api/profile/me/activity
Authorization: Bearer <access_token>
```

#### 프로필 업데이트
```http
PUT /api/profile/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "새로운 이름",
  "bio": "새로운 자기소개",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

#### 게시물 좋아요 토글
```http
POST /api/profile/post/:postId/like
Authorization: Bearer <access_token>
```

#### 강의실 좋아요 토글
```http
POST /api/profile/classroom/:classroomId/like
Authorization: Bearer <access_token>
```

### 📁 파일 (Files)

#### 파일 업로드
```http
POST /api/files/file
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "file": <file_data>,
  "title": "파일 제목",
  "description": "파일 설명",
  "categoryId": "category_id"
}
```

#### 파일 목록 조회
```http
GET /api/files?page=1&limit=20&category=documents&search=JavaScript
Authorization: Bearer <access_token>
```

#### 파일 상세 조회
```http
GET /api/files/:fileId
Authorization: Bearer <access_token>
```

#### 파일 정보 수정
```http
PUT /api/files/:fileId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "새로운 제목",
  "description": "새로운 설명"
}
```

#### 파일 삭제
```http
DELETE /api/files/:fileId
Authorization: Bearer <access_token>
```

## 🔄 Socket.IO 이벤트

### 클라이언트 → 서버

#### 강의실 입장
```javascript
socket.emit('join_classroom', {
  classroomId: 'classroom_id'
});
```

#### 메시지 전송
```javascript
socket.emit('send_message', {
  content: '안녕하세요!',
  classroomId: 'classroom_id',
  type: 'text'
});
```

#### 타이핑 시작/종료
```javascript
socket.emit('typing_start', { classroomId: 'classroom_id' });
socket.emit('typing_stop', { classroomId: 'classroom_id' });
```

### 서버 → 클라이언트

#### 연결 확인
```javascript
socket.on('connected', (data) => {
  console.log('연결됨:', data);
});
```

#### 새 메시지 수신
```javascript
socket.on('new_message', (data) => {
  console.log('새 메시지:', data.message);
});
```

#### 사용자 입장/퇴장
```javascript
socket.on('user_joined', (data) => {
  console.log('사용자 입장:', data.userName);
});

socket.on('user_left', (data) => {
  console.log('사용자 퇴장:', data.userName);
});
```

#### 타이핑 상태
```javascript
socket.on('user_typing', (data) => {
  console.log('타이핑 중:', data.userName, data.isTyping);
});
```

## 📊 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": {
    // 응답 데이터
  },
  "message": "성공 메시지"
}
```

### 오류 응답
```json
{
  "success": false,
  "message": "오류 메시지",
  "error": "상세 오류 정보",
  "code": "ERROR_CODE"
}
```

## 🚦 HTTP 상태 코드

- `200` - 성공
- `201` - 생성됨
- `400` - 잘못된 요청
- `401` - 인증 필요
- `403` - 권한 없음
- `404` - 찾을 수 없음
- `429` - 요청 제한 초과
- `500` - 서버 오류

## 🔒 Rate Limiting

- **일반 API**: 분당 60회
- **인증 API**: 분당 5회
- **파일 업로드**: 분당 10회
- **AI 검색**: 분당 10회
- **AI 작업**: 분당 5회

## 🔧 개발 도구

### Postman 컬렉션
```bash
# Postman 컬렉션 파일 위치
/docs/postman/openclass-api.json
```

### API 테스트
```bash
# 헬스 체크
curl http://localhost:5001/health

# 로그인 테스트
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🐛 에러 코드 참조

### 인증 오류
- `NO_TOKEN` - 토큰 없음
- `INVALID_TOKEN` - 유효하지 않은 토큰
- `TOKEN_EXPIRED` - 토큰 만료
- `INVALID_CREDENTIALS` - 잘못된 자격 증명

### 검증 오류
- `VALIDATION_ERROR` - 입력 데이터 검증 실패
- `EMAIL_ALREADY_EXISTS` - 이미 존재하는 이메일
- `USER_NOT_FOUND` - 사용자 없음

### 권한 오류
- `INSUFFICIENT_PERMISSIONS` - 권한 부족
- `ACCOUNT_DISABLED` - 계정 비활성화
- `EMAIL_NOT_VERIFIED` - 이메일 미인증

### 시스템 오류
- `INTERNAL_ERROR` - 서버 내부 오류
- `RATE_LIMIT_EXCEEDED` - 요청 제한 초과
- `FILE_TOO_LARGE` - 파일 크기 초과

---

**더 자세한 API 문서가 필요하시면 언제든지 문의해주세요!** 📚
