export interface User {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'instructor' | 'student';
    avatar?: string;
    bio?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Classroom {
    id: number;
    name: string;
    description: string;
    instructorId: number;
    instructor?: User;
    isPublic: boolean;
    maxStudents?: number;
    coverImage?: string;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
        members: number;
        posts: number;
    };
}
export interface Post {
    id: number;
    title: string;
    content: string;
    authorId: number;
    author?: User;
    classroomId?: number;
    classroom?: Classroom;
    categoryId?: number;
    category?: Category;
    tags: string[];
    isPublished: boolean;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
        likes: number;
        comments: number;
    };
}
export interface Category {
    id: number;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    parentId?: number;
    parent?: Category;
    children?: Category[];
    createdAt: Date;
    updatedAt: Date;
}
export interface FileUpload {
    id: number;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    publicId?: string;
    uploaderId: number;
    uploader?: User;
    classroomId?: number;
    classroom?: Classroom;
    categoryId?: number;
    category?: Category;
    description?: string;
    tags: string[];
    downloadCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface DocumentEmbedding {
    id: number;
    content: string;
    title?: string;
    embedding: number[];
    metadata: Record<string, any>;
    sourceType: 'post' | 'file' | 'classroom' | 'comment';
    sourceId: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface SearchResult {
    id: number;
    content: string;
    title?: string;
    similarity?: number;
    combined_score?: number;
    vector_score?: number;
    keyword_score?: number;
    source_type: string;
    source_id: number;
    metadata?: Record<string, any>;
    created_at?: string;
}
export interface SearchResponse {
    query: string;
    results: SearchResult[];
    count: number;
    searchType: 'semantic' | 'hybrid' | 'keyword';
    weights?: {
        keywordWeight: number;
        vectorWeight: number;
    };
    responseTime?: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    role?: 'instructor' | 'student';
}
export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
export interface SearchFilters {
    category?: string;
    tags?: string[];
    author?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    sourceType?: 'post' | 'file' | 'classroom';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    sortBy?: 'relevance' | 'date' | 'popularity' | 'title';
    sortOrder?: 'asc' | 'desc';
}
export interface UploadProgress {
    id: string;
    filename: string;
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
}
export interface CloudinaryResponse {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    placeholder: boolean;
    url: string;
    secure_url: string;
    access_mode: string;
}
export interface SocketEvents {
    'join-room': {
        roomId: string;
    };
    'leave-room': {
        roomId: string;
    };
    'send-message': {
        roomId: string;
        message: string;
    };
    'typing-start': {
        roomId: string;
    };
    'typing-stop': {
        roomId: string;
    };
    'room-joined': {
        roomId: string;
        users: User[];
    };
    'room-left': {
        roomId: string;
    };
    'new-message': {
        roomId: string;
        message: ChatMessage;
        sender: User;
    };
    'user-typing': {
        roomId: string;
        user: User;
    };
    'user-stopped-typing': {
        roomId: string;
        user: User;
    };
    'user-joined': {
        roomId: string;
        user: User;
    };
    'user-left': {
        roomId: string;
        user: User;
    };
    'error': {
        message: string;
    };
}
export interface ChatMessage {
    id: number;
    content: string;
    senderId: number;
    sender?: User;
    roomId: string;
    type: 'text' | 'image' | 'file';
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export interface EnvironmentVariables {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;
    OPENAI_API_KEY?: string;
    ALLOWED_ORIGINS?: string;
    ENABLE_VECTOR_SEARCH?: string;
    EMBEDDING_MODEL?: string;
    VECTOR_DIMENSIONS?: string;
}
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string, field?: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=types.d.ts.map