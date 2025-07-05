'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Filter, 
  Clock, 
  TrendingUp, 
  FileText, 
  Video, 
  Image, 
  Music,
  X,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useSmartSearch, useSearchFilters } from '@/hooks/useAISearch';
import { SearchResult } from '@/lib/aiSearchApi';

interface AISearchComponentProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  maxResults?: number;
}

export const AISearchComponent: React.FC<AISearchComponentProps> = ({
  onResultClick,
  placeholder = "AI에게 무엇이든 물어보세요... (예: JavaScript 기초 강의 찾아줘)",
  showFilters = true,
  maxResults = 20
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    searchQuery,
    searchResults,
    suggestions,
    showSuggestions,
    searchHistory,
    popularSearches,
    isLoading,
    error,
    setSearchQuery,
    performSearch,
    selectSuggestion,
    clearSearch,
    setShowSuggestions,
    hasResults
  } = useSmartSearch();

  const {
    filters,
    setFilters,
    filteredResults,
    availableTags,
    resultCount
  } = useSearchFilters(searchResults);

  // 검색 입력 처리
  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;
    
    try {
      await performSearch(query, { limit: maxResults });
      setIsExpanded(true);
    } catch (error) {
      console.error('검색 실패:', error);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        selectSuggestion(suggestions[0]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  // 결과 클릭 처리
  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result.id);
    onResultClick?.(result);
  };

  // 파일 타입 아이콘
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'FILE':
        return <FileText className="w-4 h-4" />;
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      case 'IMAGE':
        return <Image className="w-4 h-4" />;
      case 'AUDIO':
        return <Music className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // 관련도 점수 표시
  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 검색 입력 영역 */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Sparkles className="h-5 w-5 text-blue-500" />
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="block w-full pl-10 pr-12 py-4 border-2 border-gray-200 rounded-xl 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     placeholder-gray-400 text-lg transition-all duration-200
                     shadow-sm hover:shadow-md focus:shadow-lg"
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !searchQuery.trim()}
              className="mr-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-200 flex items-center gap-1"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* 검색 제안 드롭다운 */}
        {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0 || popularSearches.length > 0) && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg">
            {suggestions.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Zap className="w-4 h-4" />
                  AI 제안
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg 
                             flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {searchHistory.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  최근 검색
                </div>
                {searchHistory.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(item)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg 
                             transition-colors text-gray-700"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {popularSearches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  인기 검색어
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.slice(0, 5).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => selectSuggestion(item)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full 
                               text-sm hover:bg-gray-200 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">검색 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        </div>
      )}

      {/* 검색 결과 영역 */}
      {(hasResults || isLoading) && (
        <div className="mt-6">
          {/* 필터 영역 */}
          {showFilters && hasResults && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">필터:</span>
                </div>
                
                {/* 타입 필터 */}
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="ALL">모든 타입</option>
                  <option value="FILE">파일</option>
                  <option value="POST">게시물</option>
                  <option value="COURSE">강의</option>
                </select>

                {/* 정렬 옵션 */}
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="relevance">관련도순</option>
                  <option value="date">최신순</option>
                  <option value="title">제목순</option>
                </select>

                <span className="text-sm text-gray-600">
                  {resultCount}개 결과
                </span>
              </div>

              {/* 태그 필터 */}
              {availableTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableTags.slice(0, 10).map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          tags: prev.tags.includes(tag)
                            ? prev.tags.filter(t => t !== tag)
                            : [...prev.tags, tag]
                        }));
                      }}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span>AI가 최적의 결과를 찾고 있습니다...</span>
              </div>
            </div>
          )}

          {/* 검색 결과 목록 */}
          {!isLoading && hasResults && (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`p-6 bg-white border border-gray-200 rounded-xl shadow-sm 
                           hover:shadow-md transition-all duration-200 cursor-pointer
                           ${selectedResult === result.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                >
                  {/* 결과 헤더 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getFileTypeIcon(result.type)}
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {result.type}
                        </span>
                      </div>
                      
                      {/* 관련도 점수 */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getRelevanceColor(result.relevanceScore)
                      }`}>
                        {Math.round(result.relevanceScore * 100)}% 관련
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {result.title}
                  </h3>

                  {/* AI 요약 또는 설명 */}
                  {result.aiSummary ? (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">AI 요약</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {result.aiSummary}
                      </p>
                    </div>
                  ) : result.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {result.description}
                    </p>
                  )}

                  {/* 태그 */}
                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.tags.slice(0, 5).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {result.tags.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{result.tags.length - 5}개 더
                        </span>
                      )}
                    </div>
                  )}

                  {/* URL이 있는 경우 링크 표시 */}
                  {result.url && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <ArrowRight className="w-4 h-4" />
                      <span>자세히 보기</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 결과 없음 */}
          {!isLoading && !hasResults && searchQuery && (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-600 mb-4">
                  '{searchQuery}'에 대한 검색 결과를 찾을 수 없습니다.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• 다른 키워드로 검색해보세요</p>
                  <p>• 검색어의 철자가 정확한지 확인해보세요</p>
                  <p>• 더 간단한 단어로 검색해보세요</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISearchComponent;
