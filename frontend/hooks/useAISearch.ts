import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiSearchApi, AISearchRequest, SearchResult } from '@/lib/aiSearchApi';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';

// AI 검색 훅
export const useAISearch = () => {
  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: aiSearchApi.search,
    onSuccess: (data) => {
      // 검색 결과를 캐시에 저장
      queryClient.setQueryData(['ai-search', data.data.query], data);
    },
  });

  const search = useCallback((request: AISearchRequest) => {
    return searchMutation.mutateAsync(request);
  }, [searchMutation]);

  return {
    search,
    isLoading: searchMutation.isPending,
    error: searchMutation.error,
    data: searchMutation.data,
    reset: searchMutation.reset,
  };
};

// 검색 제안 훅
export const useSearchSuggestions = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => aiSearchApi.getSuggestions(query),
    enabled: enabled && query.length > 1,
    staleTime: 5 * 60 * 1000, // 5분 동안 fresh
    retry: 1,
  });
};

// 자동 태그 생성 훅
export const useAutoTags = () => {
  return useMutation({
    mutationFn: aiSearchApi.generateAutoTags,
  });
};

// 인기 검색어 훅
export const usePopularSearches = () => {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: aiSearchApi.getPopularSearches,
    staleTime: 30 * 60 * 1000, // 30분 동안 fresh
    retry: 1,
  });
};

// 통합 검색 훅 (검색 상태 관리)
export const useSmartSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);

  const aiSearch = useAISearch();
  const popularSearches = usePopularSearches();

  // 로컬스토리지에서 검색 히스토리 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem('openclass-search-history');
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('검색 히스토리 복원 실패:', error);
    }
  }, []);

  // 검색 히스토리 저장
  useEffect(() => {
    try {
      localStorage.setItem('openclass-search-history', JSON.stringify(searchHistory));
    } catch (error) {
      console.warn('검색 히스토리 저장 실패:', error);
    }
  }, [searchHistory]);

  // 디바운스된 제안 조회
  const debouncedGetSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length > 1) {
        try {
          const response = await aiSearchApi.getSuggestions(query);
          setSuggestions(response.data.suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('제안 조회 실패:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    []
  );

  // 검색어 변경 시 제안 조회
  useEffect(() => {
    if (searchQuery && showSuggestions) {
      debouncedGetSuggestions(searchQuery);
    }
    return () => {
      debouncedGetSuggestions.cancel();
    };
  }, [searchQuery, showSuggestions, debouncedGetSuggestions]);

  // 검색 실행
  const performSearch = useCallback(async (query: string, options?: Partial<AISearchRequest>) => {
    if (!query.trim()) return;

    // 너무 빠른 연속 검색 방지
    const now = Date.now();
    if (now - lastSearchTime < 500) {
      return;
    }
    setLastSearchTime(now);

    try {
      const response = await aiSearch.search({
        query: query.trim(),
        type: 'ALL',
        limit: 20,
        includeAISummary: true,
        ...options,
      });

      setSearchResults(response.data.results);
      
      // 검색 히스토리에 추가
      setSearchHistory(prev => {
        const updated = [query, ...prev.filter(item => item !== query)];
        return updated.slice(0, 10); // 최대 10개만 저장
      });

      setShowSuggestions(false);
      
      return response;
    } catch (error) {
      console.error('검색 실패:', error);
      // 에러 시 더미 데이터 제공
      setSearchResults(getDummyResults(query));
      throw error;
    }
  }, [aiSearch, lastSearchTime]);

  // 제안 선택
  const selectSuggestion = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  }, [performSearch]);

  // 검색어 초기화
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  // 히스토리 클리어
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('openclass-search-history');
    } catch (error) {
      console.warn('검색 히스토리 삭제 실패:', error);
    }
  }, []);

  // 더미 검색 결과 생성 (에러 시 폴백)
  const getDummyResults = useCallback((query: string): SearchResult[] => {
    const dummyResults = [
      {
        id: 'dummy-js',
        title: 'JavaScript 기초 완성 강의',
        description: 'JavaScript의 핵심 개념을 단계별로 학습하는 완전 입문 강의',
        content: 'ES6+ 문법, 비동기 처리, DOM 조작, 이벤트 처리 등을 실습 중심으로 학습',
        type: 'COURSE' as const,
        url: '/courses/javascript-basics',
        relevanceScore: 0.95,
        aiSummary: 'JavaScript 기초부터 실무까지 체계적으로 학습할 수 있는 종합 강의입니다.',
        tags: ['JavaScript', '프로그래밍', '웹개발', '프론트엔드'],
        author: { id: '1', name: '김개발' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'dummy-react',
        title: 'React 실전 프로젝트',
        description: 'React를 사용한 실제 프로젝트 구축 가이드',
        content: 'Hook, Context API, 상태관리, 라우팅 등을 실전 프로젝트로 학습',
        type: 'POST' as const,
        url: '/posts/react-project',
        relevanceScore: 0.85,
        tags: ['React', 'Frontend', '프로젝트'],
        author: { id: '2', name: '박프론트' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'dummy-nodejs',
        title: 'Node.js API 개발 가이드',
        description: 'Node.js로 RESTful API 서버 구축하기',
        content: 'Express, 미들웨어, 데이터베이스 연동, 인증 시스템 구축',
        type: 'FILE' as const,
        url: 'https://example.com/nodejs-guide.pdf',
        relevanceScore: 0.75,
        tags: ['Node.js', 'Backend', 'API', 'Express'],
        author: { id: '3', name: '이백엔드' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 검색어와 관련성 높은 결과만 필터링
    return dummyResults.filter(result => {
      const lowerQuery = query.toLowerCase();
      return result.title.toLowerCase().includes(lowerQuery) ||
             result.description?.toLowerCase().includes(lowerQuery) ||
             result.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    });
  }, []);

  return {
    // 상태
    searchQuery,
    searchResults,
    searchHistory,
    suggestions,
    showSuggestions,
    isLoading: aiSearch.isLoading,
    error: aiSearch.error,
    popularSearches: popularSearches.data?.data.popularSearches || [
      'JavaScript 기초', 'React 입문', 'Python 데이터분석', 'Node.js API',
      '웹개발 기초', '알고리즘', '데이터베이스', '머신러닝'
    ],

    // 액션
    setSearchQuery,
    performSearch,
    selectSuggestion,
    clearSearch,
    clearHistory,
    setShowSuggestions,

    // 유틸리티
    hasResults: searchResults.length > 0,
    hasError: !!aiSearch.error,
    searchTime: lastSearchTime
  };
};

// 검색 결과 필터링 훅
export const useSearchFilters = (results: SearchResult[]) => {
  const [filters, setFilters] = useState({
    type: 'ALL' as 'ALL' | 'FILE' | 'POST' | 'COURSE',
    sortBy: 'relevance' as 'relevance' | 'date' | 'title',
    tags: [] as string[],
  });

  const filteredResults = useMemo(() => {
    let filtered = results;

    // 타입 필터
    if (filters.type !== 'ALL') {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    // 태그 필터
    if (filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        filters.tags.every(tag => item.tags.includes(tag))
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, filters]);

  // 사용 가능한 태그 목록
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    results.forEach(item => {
      item.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [results]);

  return {
    filters,
    setFilters,
    filteredResults,
    availableTags,
    resultCount: filteredResults.length,
  };
};
