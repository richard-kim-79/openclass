'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Eye, FileText, Video, Image, Code } from 'lucide-react'
import { usePosts, useLikePost } from '@/hooks/usePosts'
import { useClassrooms, useJoinClassroom } from '@/hooks/useClassrooms'
import toast from 'react-hot-toast'

interface Post {
  id: string
  title: string
  content?: string
  author: {
    id: string
    name: string
    avatarUrl?: string
  }
  classroom?: {
    id: string
    name: string
  }
  type: 'document' | 'video' | 'image' | 'code'
  tags: string[]
  likesCount: number
  createdAt: string
  _count?: {
    likes?: number
    comments?: number
  }
}

interface Classroom {
  id: string
  name: string
  description?: string
  owner: {
    id: string
    name: string
    avatarUrl?: string
  }
  category: string
  level: string
  _count: {
    memberships: number
    posts: number
  }
}

const getTypeIcon = (type: string) => {
  switch(type) {
    case 'document': return <FileText className="w-4 h-4" />
    case 'video': return <Video className="w-4 h-4" />
    case 'image': return <Image className="w-4 h-4" />
    case 'code': return <Code className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

export function HomeFeed() {
  const [activeTab, setActiveTab] = useState<'posts' | 'classrooms'>('posts')
  const router = useRouter()
  
  const { data: postsData, isLoading: postsLoading } = usePosts()
  const { data: classroomsData, isLoading: classroomsLoading } = useClassrooms()
  const likeMutation = useLikePost()
  const joinMutation = useJoinClassroom()

  const handleLike = (postId: string) => {
    likeMutation.mutate(postId)
  }

  const handleJoinClassroom = (classroomId: string) => {
    // 직접 강의실로 이동 (실제로는 가입 후 이동)
    toast.success('강의실에 입장했습니다!')
    router.push(`/classroom/${classroomId}`)
  }

  const posts = postsData?.data || []
  const classrooms = classroomsData?.data || []

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">홈</h2>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'posts' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                학습자료
              </button>
              <button
                onClick={() => setActiveTab('classrooms')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'classrooms' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                강의실
              </button>
            </div>
          </div>
        </div>
        
        <div className="h-[600px] overflow-y-auto">
          {activeTab === 'posts' ? (
            <div className="divide-y divide-gray-100">
              {postsLoading ? (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-600">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>학습자료를 불러오는 중...</span>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  아직 게시된 학습자료가 없습니다.
                </div>
              ) : (
                posts.map((post: Post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {post.author.name[0]}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{post.author.name}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                          {post.classroom && (
                            <>
                              <span className="text-gray-500">•</span>
                              <button
                                onClick={() => handleJoinClassroom(post.classroom!.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {post.classroom.name}
                              </button>
                            </>
                          )}
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{post.title}</h3>
                        {post.content && (
                          <p className="text-gray-700 mb-3 leading-relaxed">{post.content}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mb-3">
                          {getTypeIcon(post.type)}
                          <span className="text-sm text-gray-500 capitalize">{post.type}</span>
                          {post.tags && post.tags.length > 0 && (
                            <>
                              <span className="text-gray-500">•</span>
                              <div className="flex gap-1">
                                {post.tags.map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <button
                              onClick={() => handleLike(post.id)}
                              disabled={likeMutation.isPending}
                              className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              <Heart className="w-4 h-4" />
                              <span className="text-sm">{post._count?.likes ?? post.likesCount ?? 0}</span>
                            </button>
                            
                            <div className="flex items-center gap-1 text-gray-500">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">{post._count?.comments ?? 0}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-gray-500">
                              <Eye className="w-4 h-4" />
                              <span className="text-sm">{Math.floor(Math.random() * 100) + 10}</span>
                            </div>
                          </div>
                          
                          <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs hover:bg-blue-200 transition-colors">
                            자세히 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {classroomsLoading ? (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-600">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>강의실을 불러오는 중...</span>
                  </div>
                </div>
              ) : classrooms.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  아직 개설된 강의실이 없습니다.
                </div>
              ) : (
                classrooms.map((classroom: Classroom) => (
                  <div key={classroom.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {classroom.category === '개발' ? '💻' : 
                         classroom.category === 'AI' ? '🤖' : 
                         classroom.category === '디자인' ? '🎨' : 
                         classroom.category === '데이터' ? '📊' : '📚'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">{classroom.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {classroom.category}
                          </span>
                        </div>
                        
                        {classroom.description && (
                          <p className="text-gray-700 mb-3 leading-relaxed">{classroom.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <span>{classroom._count.memberships}명 참여</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{classroom._count.posts}개 게시물</span>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                            {classroom.level}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            강사: <span className="font-medium">{classroom.owner.name}</span>
                          </div>
                          
                          <button 
                            onClick={() => handleJoinClassroom(classroom.id)}
                            disabled={joinMutation.isPending}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                          >
                            {joinMutation.isPending ? '입장 중...' : '입장하기'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}