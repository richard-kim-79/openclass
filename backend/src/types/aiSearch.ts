import { z } from 'zod';

// OpenAI API 응답 타입
export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// AI 검색 관련 유틸리티 타입
export interface SearchQueryAnalysis {
  keywords: string[];
  intent: 'search' | 'question' | 'command';
  category?: string;
  complexity: 'simple' | 'moderate' | 'complex';
  language: 'ko' | 'en' | 'mixed';
}

export interface AISearchMetrics {
  queryAnalysisTime: number;
  basicSearchTime: number;
  semanticSearchTime: number;
  summaryGenerationTime: number;
  totalProcessingTime: number;
  openaiApiCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

// 검색 결과 타입 확장
export interface EnhancedSearchResult {
  id: string;
  title: string;
  content?: string;
  type: 'FILE' | 'POST' | 'COURSE' | 'USER';
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tags: string[];
  relevanceScore: number;
  aiSummary?: string;
  url?: string;
  thumbnail?: string;
  metadata?: {
    fileSize?: number;
    duration?: number;
    difficulty?: string;
    language?: string;
  };
  createdAt: string;
  updatedAt: string;
  highlightedContent?: string; // 검색어가 강조된 내용
}

// 검색 컨텍스트
export interface SearchContext {
  userId?: string;
  userRole?: 'student' | 'instructor' | 'admin';
  userPreferences?: {
    preferredLanguage?: string;
    difficultyLevel?: string;
    interests?: string[];
  };
  searchHistory?: string[];
  currentClassroom?: string;
}

// AI 검색 설정
export interface AISearchConfig {
  enableOpenAI: boolean;
  openaiModel: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  maxTokens: number;
  temperature: number;
  enableCaching: boolean;
  cacheExpiry: number; // minutes
  enableSemantricSearch: boolean;
  enableAutoSummary: boolean;
  enableAutoTags: boolean;
  relevanceThreshold: number;
  maxResults: number;
}

// 검색 필터
export interface SearchFilters {
  type?: 'FILE' | 'POST' | 'COURSE' | 'USER';
  dateRange?: {
    from: Date;
    to: Date;
  };
  author?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  fileType?: string[];
  classroom?: string;
  sortBy?: 'relevance' | 'date' | 'popularity' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// 검색 응답 타입
export interface AISearchResponse {
  success: boolean;
  data: {
    query: string;
    results: EnhancedSearchResult[];
    total: number;
    searchTime: number;
    filters?: SearchFilters;
    suggestions?: string[];
    relatedQueries?: string[];
    metrics?: AISearchMetrics;
  };
  message: string;
}

// Zod 스키마들
export const searchRequestSchema = z.object({
  query: z.string().min(1, '검색어를 입력해주세요.').max(500, '검색어가 너무 깁니다.'),
  type: z.enum(['FILE', 'POST', 'COURSE', 'USER', 'ALL']).optional().default('ALL'),
  filters: z.object({
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    language: z.string().optional(),
    fileType: z.array(z.string()).optional(),
    classroom: z.string().optional(),
    sortBy: z.enum(['relevance', 'date', 'popularity', 'title']).optional().default('relevance'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }).optional(),
  limit: z.number().min(1).max(100).optional().default(10),
  offset: z.number().min(0).optional().default(0),
  includeAISummary: z.boolean().optional().default(false),
  includeRelatedQueries: z.boolean().optional().default(false),
  enableSemanticSearch: z.boolean().optional().default(true),
});

export const suggestionsRequestSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().min(1).max(20).optional().default(8),
  context: z.object({
    currentPage: z.string().optional(),
    recentSearches: z.array(z.string()).optional(),
  }).optional(),
});

export const autoTagsRequestSchema = z.object({
  content: z.string().min(10, '콘텐츠가 너무 짧습니다.').max(10000, '콘텐츠가 너무 깁니다.'),
  maxTags: z.number().min(1).max(20).optional().default(8),
  language: z.enum(['ko', 'en', 'auto']).optional().default('auto'),
});

// 에러 타입
export class AISearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AISearchError';
  }
}

// OpenAI API 관련 상수
export const OPENAI_MODELS = {
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  GPT_4: 'gpt-4',
  GPT_4_TURBO: 'gpt-4-turbo-preview',
} as const;

export const AI_PROMPTS = {
  QUERY_ANALYSIS: `
주어진 검색어를 분석하여 다음 정보를 JSON 형식으로 제공해주세요:
- keywords: 핵심 키워드 배열
- intent: 검색 의도 ('search', 'question', 'command' 중 하나)
- category: 카테고리 ('프로그래밍', '수학', '과학', '언어', '예술', '기타' 중 하나)
- complexity: 복잡도 ('simple', 'moderate', 'complex' 중 하나)
- language: 언어 ('ko', 'en', 'mixed' 중 하나)

검색어: "{query}"

응답 형식:
{
  "keywords": ["키워드1", "키워드2"],
  "intent": "search",
  "category": "프로그래밍",
  "complexity": "simple",
  "language": "ko"
}
`,

  CONTENT_SUMMARY: `
다음 콘텐츠를 교육적 관점에서 1-2문장으로 간결하게 요약해주세요.
학습자가 빠르게 내용을 파악할 수 있도록 핵심 포인트를 포함해주세요.

콘텐츠:
{content}

요약:
`,

  AUTO_TAGS: `
다음 교육 콘텐츠에 적합한 태그를 {maxTags}개 생성해주세요.
태그는 학습자가 콘텐츠를 찾기 쉽도록 도와주는 키워드여야 합니다.

콘텐츠:
{content}

다음 JSON 형식으로 응답해주세요:
["태그1", "태그2", "태그3"]

조건:
- 각 태그는 한글 또는 영어로 된 단어나 짧은 구문
- 교육/학습 관련 키워드 우선
- 기술적 용어와 일반적 용어의 균형
- 중복 없이 서로 다른 관점의 태그
`,

  SEARCH_SUGGESTIONS: `
사용자가 "{query}"를 검색하고 있습니다.
교육 플랫폼에서 이와 관련된 유용한 검색어 제안을 {limit}개 생성해주세요.

제안 기준:
- 현재 검색어와 관련성 높음
- 학습자에게 도움이 되는 구체적인 검색어
- 초급부터 고급까지 다양한 수준 포함
- 실무에 활용 가능한 내용

JSON 배열 형식으로 응답:
["제안1", "제안2", "제안3"]
`,

  RELATED_QUERIES: `
"{query}" 검색과 관련하여 학습자가 추가로 궁금해할 만한 질문들을 5개 생성해주세요.

조건:
- 현재 검색 주제와 연관성
- 학습 단계별 심화 질문
- 실제 학습 상황에서 나올 법한 질문
- 구체적이고 명확한 표현

JSON 배열 형식으로 응답:
["관련 질문1", "관련 질문2", "관련 질문3"]
`
} as const;

// 캐시 관련 타입
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  key: string;
}

export interface SearchCache {
  queries: Map<string, CacheEntry<AISearchResponse>>;
  suggestions: Map<string, CacheEntry<string[]>>;
  tags: Map<string, CacheEntry<string[]>>;
  summaries: Map<string, CacheEntry<string>>;
}

// 성능 모니터링 타입
export interface PerformanceMetrics {
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  cacheHitRate: number;
  openaiApiUsage: {
    totalCalls: number;
    totalTokens: number;
    costEstimate: number;
  };
  popularQueries: Array<{
    query: string;
    count: number;
    lastUsed: Date;
  }>;
}

// 설정 기본값
export const DEFAULT_AI_SEARCH_CONFIG: AISearchConfig = {
  enableOpenAI: true,
  openaiModel: 'gpt-3.5-turbo',
  maxTokens: 500,
  temperature: 0.3,
  enableCaching: true,
  cacheExpiry: 30, // 30분
  enableSemantricSearch: true,
  enableAutoSummary: false,
  enableAutoTags: true,
  relevanceThreshold: 0.3,
  maxResults: 50,
};

export type AISearchRequestType = z.infer<typeof searchRequestSchema>;
export type SuggestionsRequestType = z.infer<typeof suggestionsRequestSchema>;
export type AutoTagsRequestType = z.infer<typeof autoTagsRequestSchema>;
