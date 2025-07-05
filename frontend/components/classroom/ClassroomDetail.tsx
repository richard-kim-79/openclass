'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft, Users, Upload as UploadIcon } from 'lucide-react'
import { useClassroom } from '@/hooks/useClassrooms'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatarUrl?: string
  }
  createdAt: string
  type: 'text' | 'file' | 'image'
  fileUrl?: string
  fileName?: string
}

interface ClassroomDetailProps {
  classroomId: string
}

export function ClassroomDetail({ classroomId }: ClassroomDetailProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { data: classroomData, isLoading } = useClassroom(classroomId)

  // Mock messages for demo
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        content: '안녕하세요! 강의실에 오신 것을 환영합니다.',
        author: { id: '1', name: '김강사' },
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'text'
      },
      {
        id: '2', 
        content: '오늘 다룰 내용에 대해 질문이 있으시면 언제든 말씀해주세요!',
        author: { id: '1', name: '김강사' },
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        type: 'text'
      },
      {
        id: '3',
        content: '강의 자료는 언제 업로드되나요?',
        author: { id: '2', name: '박학생' },
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        type: 'text'
      },
      {
        id: '4',
        content: '수업 시작 전에 미리 업로드해드리겠습니다!',
        author: { id: '1', name: '김강사' },
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'text'
      }
    ]
    setMessages(mockMessages)
    setIsConnected(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      author: { id: 'current-user', name: '나' },
      createdAt: new Date().toISOString(),
      type: 'text'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Simulate instructor response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: '좋은 질문이네요! 더 자세히 설명해드리겠습니다.',
        author: { id: '1', name: '김강사' },
        createdAt: new Date().toISOString(),
        type: 'text'
      }
      setMessages(prev => [...prev, response])
    }, 1000 + Math.random() * 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">강의실을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const classroom = classroomData?.data

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">
              {classroom?.name || '강의실'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{classroom?.owner?.name || '강사'}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{(classroom as any)?._count?.memberships || 0}명 참여중</span>
              </div>
              {isConnected && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">실시간 연결됨</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Info */}
      {classroom?.description && (
        <div className="bg-blue-50 border-b border-blue-200 p-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              📚
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">강의실 소개</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                {classroom.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {message.author.name[0]}
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {message.author.name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="flex gap-3">
          <textarea
            placeholder="메시지를 입력하세요... (Shift + Enter로 줄바꿈)"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          <button className="flex items-center justify-center w-12 h-12 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <UploadIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            전송
          </button>
        </div>
      </div>
    </div>
  )
}