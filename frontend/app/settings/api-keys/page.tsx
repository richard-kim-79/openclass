'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ApiKey, ApiUsage } from '../../../types/auth';

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API 키 조회
  const fetchApiKey = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/apikey/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openclass_access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.data);
      } else if (response.status === 404) {
        setApiKey(null);
      }
    } catch (error) {
      console.error('API 키 조회 오류:', error);
      setMessage({ type: 'error', text: 'API 키 조회 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // API 키 발급
  const generateApiKey = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/apikey/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openclass_access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.data);
        setMessage({ type: 'success', text: 'API 키가 성공적으로 발급되었습니다.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'API 키 발급에 실패했습니다.' });
      }
    } catch (error) {
      console.error('API 키 발급 오류:', error);
      setMessage({ type: 'error', text: 'API 키 발급 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // API 키 재발급
  const regenerateApiKey = async () => {
    if (!confirm('기존 API 키가 무효화됩니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/apikey/regenerate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openclass_access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.data);
        setMessage({ type: 'success', text: 'API 키가 성공적으로 재발급되었습니다.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'API 키 재발급에 실패했습니다.' });
      }
    } catch (error) {
      console.error('API 키 재발급 오류:', error);
      setMessage({ type: 'error', text: 'API 키 재발급 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // API 키 삭제
  const deleteApiKey = async () => {
    if (!confirm('API 키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/apikey/me', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openclass_access_token')}`
        }
      });

      if (response.ok) {
        setApiKey(null);
        setMessage({ type: 'success', text: 'API 키가 성공적으로 삭제되었습니다.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'API 키 삭제에 실패했습니다.' });
      }
    } catch (error) {
      console.error('API 키 삭제 오류:', error);
      setMessage({ type: 'error', text: 'API 키 삭제 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // API 키 복사
  const copyApiKey = () => {
    if (apiKey?.key) {
      navigator.clipboard.writeText(apiKey.key);
      setMessage({ type: 'success', text: 'API 키가 클립보드에 복사되었습니다.' });
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API 키 관리</h1>
        <p className="text-gray-600">
          OpenClass API를 사용하기 위한 API 키를 관리합니다.
        </p>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* API 키 상태 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">API 키 상태</h2>
          {apiKey && (
            <div className="flex space-x-2">
              <button
                onClick={copyApiKey}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
              >
                복사
              </button>
              <button
                onClick={regenerateApiKey}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50"
              >
                재발급
              </button>
              <button
                onClick={deleteApiKey}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : apiKey ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API 키
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={apiKey.key}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  발급일
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(apiKey.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  구독 플랜
                </label>
                <p className="text-sm text-gray-900 capitalize">
                  {'free'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">발급된 API 키가 없습니다.</p>
            <button
              onClick={generateApiKey}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              API 키 발급
            </button>
          </div>
        )}
      </div>

      {/* 사용량 통계 */}
      {apiKey && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">사용량 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {apiKey.usage.totalCalls.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">총 호출 수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {apiKey.usage.todayCalls.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">오늘 호출 수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {apiKey.usage.monthlyCalls.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">이번 달 호출 수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {apiKey.usage.limit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">월 제한</div>
            </div>
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">API 사용법</h2>
        <div className="space-y-4 text-sm text-blue-800">
          <div>
            <h3 className="font-medium mb-2">1. API 키 인증</h3>
            <p>요청 헤더에 API 키를 포함하여 인증합니다:</p>
            <code className="block bg-blue-100 p-2 rounded mt-1 font-mono">
              X-API-Key: your_api_key_here
            </code>
          </div>
          <div>
            <h3 className="font-medium mb-2">2. RAG 쿼리 예시</h3>
            <code className="block bg-blue-100 p-2 rounded font-mono">
              POST /api/rag/query<br/>
              Content-Type: application/json<br/>
              X-API-Key: your_api_key_here<br/><br/>
              {`{
  "query": "JavaScript 변수 선언 방법",
  "limit": 5
}`}
            </code>
          </div>
          <div>
            <h3 className="font-medium mb-2">3. 벡터 검색 예시</h3>
            <code className="block bg-blue-100 p-2 rounded font-mono">
              GET /api/rag/search?q=JavaScript&limit=10<br/>
              X-API-Key: your_api_key_here
            </code>
          </div>
        </div>
      </div>
    </div>
  );
} 