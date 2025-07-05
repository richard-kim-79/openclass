'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface SearchResult {
  id: string;
  title: string;
  content?: string;
  type: 'POST' | 'FILE' | 'CLASSROOM';
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tags: string[];
  relevanceScore: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
}

export default function RAGSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('openclass_access_token')}`
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '검색 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 기반 검색</h1>
        <p className="text-gray-600">
          자연어로 질문하면 AI가 관련 정보를 찾아 답변해드립니다.
        </p>
      </div>

      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: JavaScript 변수 선언 방법, React 컴포넌트 만들기..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '검색 중...' : '검색'}
          </button>
        </div>
      </form>

      {/* 오류 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">AI가 답변을 생성하고 있습니다...</span>
        </div>
      )}

      {/* 검색 결과 */}
      {response && (
        <div className="space-y-6">
          {/* AI 답변 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI 답변</h2>
            <div className="prose max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap">{response.answer}</p>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span>신뢰도: {Math.round(response.confidence * 100)}%</span>
            </div>
          </div>

          {/* 참고 자료 */}
          {response.sources.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                참고 자료 ({response.sources.length}개)
              </h2>
              <div className="space-y-4">
                {response.sources.map((source, index) => (
                  <div key={source.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {source.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {source.type}
                      </span>
                    </div>
                    
                    {source.content && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {source.content}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>작성자: {source.author.name}</span>
                        <span>관련도: {Math.round(source.relevanceScore * 100)}%</span>
                      </div>
                      <span>{new Date(source.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    
                    {source.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {source.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 사용 팁 */}
      <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">검색 팁</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 구체적인 질문을 하면 더 정확한 답변을 받을 수 있습니다.</li>
          <li>• "어떻게", "왜", "언제" 등의 질문어를 사용해보세요.</li>
          <li>• 특정 기술이나 개념에 대해 물어보세요.</li>
          <li>• 코드 예시나 실습 방법을 요청할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
} 