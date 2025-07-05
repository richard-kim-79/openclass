import { api } from './api';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: 'FILE' | 'POST' | 'COURSE';
  url?: string;
  relevanceScore: number;
  aiSummary?: string;
  tags: string[];
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AISearchRequest {
  query: string;
  type?: 'FILE' | 'POST' | 'COURSE' | 'ALL';
  limit?: number;
  includeAISummary?: boolean;
}

export interface AISearchResponse {
  success: boolean;
  data: {
    query: string;
    results: SearchResult[];
    total: number;
    searchTime: string;
  };
  message: string;
}

export interface SuggestionsResponse {
  success: boolean;
  data: {
    query: string;
    suggestions: string[];
  };
  message: string;
}

export interface AutoTagsRequest {
  content: string;
}

export interface AutoTagsResponse {
  success: boolean;
  data: {
    tags: string[];
  };
  message: string;
}

export interface PopularSearchesResponse {
  success: boolean;
  data: {
    popularSearches: string[];
  };
  message: string;
}

export const aiSearchApi = {
  // AI 검색 수행
  search: async (request: AISearchRequest): Promise<AISearchResponse> => {
    const response = await api.post('/ai-search/search', request);
    return response.data;
  },

  // 검색 제안 조회
  getSuggestions: async (query: string): Promise<SuggestionsResponse> => {
    const response = await api.get(`/ai-search/suggestions?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // 자동 태그 생성
  generateAutoTags: async (request: AutoTagsRequest): Promise<AutoTagsResponse> => {
    const response = await api.post('/ai-search/auto-tags', request);
    return response.data;
  },

  // 인기 검색어 조회
  getPopularSearches: async (): Promise<PopularSearchesResponse> => {
    const response = await api.get('/ai-search/popular');
    return response.data;
  },

  // 검색 통계 조회 (관리자용)
  getSearchStats: async () => {
    const response = await api.get('/ai-search/stats');
    return response.data;
  }
};
