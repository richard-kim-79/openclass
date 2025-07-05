# 📁 파일 업로드 API 문서

OpenClass 플랫폼에 Cloudinary를 이용한 파일 업로드 기능이 추가되었습니다.

## 🚀 새로 추가된 기능

### 📂 파일 관리 시스템
- 이미지, 문서, 비디오, 오디오 파일 업로드
- 실시간 업로드 진행률 표시
- 드래그 앤 드롭 지원
- 파일 검증 및 크기 제한 (최대 50MB)
- 카테고리별 파일 관리

### 🎯 지원되는 파일 형식
- **이미지**: JPEG, JPG, PNG, GIF, WebP
- **문서**: PDF, DOC, DOCX, PPT, PPTX, TXT, Markdown
- **비디오**: MP4, AVI, MOV
- **오디오**: MP3, WAV, OGG

## 📋 API 엔드포인트

### 파일 업로드

#### 단일 파일 업로드
```http
POST /api/files/file
Content-Type: multipart/form-data

Form Data:
- file: File (required)
- title: string (required)
- description: string (optional)
- categoryId: string (optional)
- tags: string (optional, comma-separated)
```

#### 이미지 업로드 (썸네일 자동 생성)
```http
POST /api/files/image
Content-Type: multipart/form-data

Form Data:
- image: File (required)
- title: string (required)
- description: string (optional)
- categoryId: string (optional)
- tags: string (optional, comma-separated)
```

#### 다중 파일 업로드
```http
POST /api/files/multiple
Content-Type: multipart/form-data

Form Data:
- files: File[] (required, max 5 files)
- title: string (required)
- description: string (optional)
- categoryId: string (optional)
- tags: string (optional, comma-separated)
```

### 파일 관리

#### 파일 목록 조회
```http
GET /api/files?type=IMAGE&categoryId=123&page=1&limit=20&search=keyword&sortBy=createdAt&sortOrder=desc
```

#### 특정 파일 조회
```http
GET /api/files/:id
```

#### 파일 정보 수정
```http
PUT /api/files/:id
Content-Type: application/json

{
  "title": "새로운 제목",
  "description": "새로운 설명",
  "categoryId": "category-id",
  "tags": "tag1,tag2,tag3"
}
```

#### 파일 삭제
```http
DELETE /api/files/:id
```

#### 파일 통계
```http
GET /api/files/stats/overview
```

### 카테고리 관리

#### 카테고리 생성
```http
POST /api/categories
Content-Type: application/json

{
  "name": "카테고리 이름",
  "description": "카테고리 설명",
  "color": "#3B82F6"
}
```

#### 카테고리 목록
```http
GET /api/categories?page=1&limit=50
```

#### 카테고리 조회
```http
GET /api/categories/:id
```

#### 카테고리 수정
```http
PUT /api/categories/:id
Content-Type: application/json

{
  "name": "새로운 이름",
  "description": "새로운 설명",
  "color": "#FF5722"
}
```

#### 카테고리 삭제
```http
DELETE /api/categories/:id
```

#### 카테고리별 파일 목록
```http
GET /api/categories/:id/files?page=1&limit=20&type=IMAGE
```

## 📱 프론트엔드 컴포넌트

### FileUploadComponent
파일 업로드를 위한 재사용 가능한 컴포넌트

```tsx
import { FileUploadComponent } from '@/components/upload/FileUploadComponent';

<FileUploadComponent
  onUploadSuccess={(files) => console.log('업로드 성공:', files)}
  onUploadError={(error) => console.error('업로드 실패:', error)}
  maxFiles={5}
  categories={categories}
/>
```

### FileUploadService
파일 업로드를 위한 유틸리티 서비스

```tsx
import { FileUploadService } from '@/lib/upload/fileUploadService';

// 단일 파일 업로드
const result = await FileUploadService.uploadFile(
  file,
  {
    title: '파일 제목',
    description: '파일 설명',
    categoryId: 'category-id',
    tags: 'tag1,tag2'
  },
  (progress) => console.log(`업로드 진행률: ${progress.percentage}%`)
);

// 파일 유효성 검사
const validation = FileUploadService.validateFile(file);
if (!validation.isValid) {
  console.error(validation.error);
}

// 파일 크기 포맷팅
const sizeStr = FileUploadService.formatFileSize(file.size);
```

## 🔧 설정 방법

### 1. Cloudinary 설정
```bash
# backend/.env 파일에 추가
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. 데이터베이스 스키마 업데이트
```bash
cd backend
npx prisma db push
```

### 3. 패키지 설치
```bash
cd backend
npm install multer-storage-cloudinary@^4.0.0
```

## 📊 데이터베이스 스키마

### File 모델
```prisma
model File {
  id           String   @id @default(cuid())
  title        String
  description  String?
  fileName     String
  originalName String
  mimeType     String
  size         Int
  url          String
  cloudinaryId String?
  type         String   // IMAGE, VIDEO, AUDIO, DOCUMENT, OTHER
  categoryId   String?
  tags         String   // JSON string for tags
  uploadedById String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  category     Category? @relation(fields: [categoryId], references: [id])
  uploadedBy   User?     @relation(fields: [uploadedById], references: [id])
}
```

### Category 모델
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  color       String?  @default("#3B82F6")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  files       File[]
}
```

## 🎉 사용 예시

### 업로드 페이지에서 사용
```tsx
// 탭 기반 UI로 게시물 작성과 파일 업로드를 분리
const [activeTab, setActiveTab] = useState<'post' | 'files'>('post');

{activeTab === 'files' ? (
  <FileUploadComponent
    onUploadSuccess={handleUploadSuccess}
    onUploadError={handleUploadError}
    maxFiles={10}
    categories={categories}
  />
) : (
  // 기존 게시물 작성 폼
)}
```

### 파일 목록 표시
```tsx
{uploadedFiles.map((file) => (
  <div key={file.id} className="file-card">
    <span>{FileUploadService.getFileIcon(file.mimeType)}</span>
    <h4>{file.title}</h4>
    <p>{file.originalName}</p>
    <p>{FileUploadService.formatFileSize(file.size)}</p>
    <a href={file.url} target="_blank">보기</a>
  </div>
))}
```

## 🔐 보안 고려사항

- 파일 타입 검증
- 파일 크기 제한 (50MB)
- 악성 파일 업로드 방지
- Cloudinary 보안 설정 활용
- 업로드 권한 관리 (향후 인증 시스템과 연동)

## 🚀 향후 개선 사항

- [ ] 사용자 인증 연동
- [ ] 파일 공유 권한 설정
- [ ] 이미지 자동 최적화
- [ ] 비디오 스트리밍 지원
- [ ] 파일 검색 기능 강화
- [ ] 일괄 다운로드 기능
