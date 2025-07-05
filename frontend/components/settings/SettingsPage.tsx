'use client';

import { useState, useEffect } from 'react';
import { Key, Copy, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiManagementOpen, setApiManagementOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiUsage, setApiUsage] = useState({ 
    totalCalls: 0, 
    todayCalls: 0, 
    monthlyCalls: 0, 
    limit: 1000 
  });
  const [loading, setLoading] = useState(false);

  // API 키 조회
  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/apikey/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openclass_access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.data.apiKey);
        setApiUsage(data.data.usage);
      }
    } catch (error) {
      console.error('API 키 조회 실패:', error);
    }
  };

  // API 키 발급
  const generateApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/apikey/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openclass_access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.data.apiKey);
        toast.success('API 키가 발급되었습니다!');
      } else {
        toast.error('API 키 발급에 실패했습니다');
      }
    } catch (error) {
      toast.error('API 키 발급 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // API 키 재발급
  const regenerateApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/apikey/regenerate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openclass_access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.data.apiKey);
        toast.success('새로운 API 키가 생성되었습니다!');
      } else {
        toast.error('API 키 재발급에 실패했습니다');
      }
    } catch (error) {
      toast.error('API 키 재발급 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success('API 키가 클립보드에 복사되었습니다!');
    }
  };

  // 컴포넌트 마운트 시 API 키 조회
  useEffect(() => {
    fetchApiKey();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">계정 및 API 설정을 관리하세요</p>
      </div>

      {/* API 키 관리 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => setApiManagementOpen(!apiManagementOpen)}
          className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">API 키 관리</h2>
              <p className="text-sm text-gray-500">개발자 API 키를 확인하고 관리하세요</p>
            </div>
          </div>
          {apiManagementOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {apiManagementOpen && (
          <div className="border-t border-gray-200 p-6 space-y-6">
            {/* 현재 API 키 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">현재 API 키</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={apiKeyVisible}
                      onChange={(e) => setApiKeyVisible(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">API 키 표시</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={copyApiKey}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      title="복사"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={regenerateApiKey}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                      title="새 키 생성"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                <code className="block bg-white p-3 rounded border font-mono text-sm">
                  {apiKeyVisible ? apiKey : apiKey.replace(/./g, '•')}
                </code>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                이 키로 RAG 검색 및 벡터 검색 API에 접근할 수 있습니다.
              </p>
            </div>

            {/* API 사용량 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">API 사용량</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">이번 달 사용량</span>
                  <span className="text-sm font-medium text-gray-900">
                    {apiUsage.monthlyCalls.toLocaleString()} / {apiUsage.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(apiUsage.monthlyCalls / apiUsage.limit) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {apiUsage.limit - apiUsage.monthlyCalls}회 남음 • 매월 1일 초기화
                </p>
              </div>
            </div>

            {/* API 액션 */}
            <div className="flex gap-3">
              <button
                onClick={regenerateApiKey}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? '생성 중...' : '새 키 생성'}
              </button>
              <button
                onClick={copyApiKey}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                복사
              </button>
              <a
                href="/settings/api-keys"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                상세 관리
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 계정 설정 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 설정</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              type="text"
              value="테스트 사용자"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이름을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              type="email"
              value="test@openclass.ai"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이메일을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              구독 플랜
            </label>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                무료 플랜
              </span>
              <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                업그레이드 →
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            변경사항 저장
          </button>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">이메일 알림</h3>
              <p className="text-sm text-gray-500">새로운 메시지나 업데이트를 이메일로 받기</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">브라우저 알림</h3>
              <p className="text-sm text-gray-500">실시간 알림을 브라우저에서 받기</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 개발자 도구 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">개발자 도구</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">API 문서</h3>
              <p className="text-sm text-gray-500">OpenClass API 사용법 확인</p>
            </div>
            <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
              문서 보기
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">RAG 검색 테스트</h3>
              <p className="text-sm text-gray-500">AI 기반 검색 기능 테스트</p>
            </div>
            <a
              href="/ai-search"
              className="px-3 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm"
            >
              테스트하기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 