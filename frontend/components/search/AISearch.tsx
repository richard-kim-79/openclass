'use client'

import { useState } from 'react'
import { Search, Brain, Sparkles } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'

export function AISearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  
  const { data: searchResults, isLoading, error } = useSearch(submittedQuery)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI 검색</h1>
        <p className="text-gray-600">원하는 학습자료를 자연어로 검색해보세요</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="예: React 상태 관리 방법, Python 머신러닝 기초"
            className="w-full pl-12 pr-32 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                AI 검색 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI 검색
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">AI가 의미를 분석하여 최적의 결과를 찾고 있습니다...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">검색 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        </div>
      )}

      {searchResults && !isLoading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Brain className="w-4 h-4 text-green-500" />
            <span>
              {(((searchResults.data as any)?.posts?.length || 0) + ((searchResults.data as any)?.classrooms?.length || 0))}개의 관련 자료를 찾았습니다
            </span>
          </div>
          
          {/* 게시물 결과 */}
          {((searchResults.data as any)?.posts && (searchResults.data as any).posts.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 학습자료</h3>
              <div className="space-y-3">
                {(searchResults.data as any).posts.map((post: any) => (
                  <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{post.title}</h4>
                      <div className="flex items-center gap-1">
                        <Brain className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          {Math.round(post.relevance || 50)}%
                        </span>
                      </div>
                    </div>
                    
                    {post.content && (
                      <p className="text-gray-700 mb-3 leading-relaxed">{post.content}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{post.author?.name}</span>
                      {post.classroom && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">{post.classroom.name}</span>
                        </>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {post.tags.map((tag: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 강의실 결과 */}
          {((searchResults.data as any)?.classrooms && (searchResults.data as any).classrooms.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🏫 강의실</h3>
              <div className="space-y-3">
                {(searchResults.data as any).classrooms.map((classroom: any) => (
                  <div key={classroom.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{classroom.name}</h4>
                      <div className="flex items-center gap-1">
                        <Brain className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          {Math.round(classroom.relevance || 50)}%
                        </span>
                      </div>
                    </div>
                    
                    {classroom.description && (
                      <p className="text-gray-700 mb-3 leading-relaxed">{classroom.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{classroom.owner?.name}</span>
                        <span>•</span>
                        <span>{classroom._count?.memberships || 0}명 참여</span>
                        <span>•</span>
                        <span>{classroom.category}</span>
                      </div>
                      
                      <button className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        입장하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 검색 결과가 없는 경우 */}
          {searchResults.data && 
           (!((searchResults.data as any)?.posts || ((searchResults.data as any)?.posts?.length === 0)) &&
            !((searchResults.data as any)?.classrooms || ((searchResults.data as any)?.classrooms?.length === 0))) && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-2">'{submittedQuery}'에 대한 검색 결과가 없습니다.</p>
              <p className="text-sm text-gray-500">다른 키워드로 시도해보세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}