'use client'

import { TrendingUp, Upload, BookOpen, Users, Heart, MessageCircle, Plus } from 'lucide-react'
import { usePosts } from '@/hooks/usePosts'
import { useClassrooms } from '@/hooks/useClassrooms'

interface Activity {
  id: string
  type: 'upload' | 'comment' | 'like' | 'classroom_create' | 'join'
  title: string
  timestamp: string
  likes?: number
  content?: string
  students?: number
  instructor?: string
}

const mockActivities: Activity[] = [
  { 
    id: '1', 
    type: 'upload', 
    title: 'React Hooks 완전 정복 가이드', 
    timestamp: '2시간 전', 
    likes: 42 
  },
  { 
    id: '2', 
    type: 'comment', 
    title: 'Python 데이터 분석 기초', 
    timestamp: '5시간 전', 
    content: '정말 유용한 자료네요!' 
  },
  { 
    id: '3', 
    type: 'like', 
    title: 'Vue.js 3.0 마이그레이션 가이드', 
    timestamp: '1일 전' 
  },
  { 
    id: '4', 
    type: 'classroom_create', 
    title: 'JavaScript 고급과정', 
    timestamp: '3일 전', 
    students: 8 
  },
  { 
    id: '5', 
    type: 'join', 
    title: 'UX 디자인 실무', 
    timestamp: '1주일 전', 
    instructor: '이디자인' 
  },
]

export function Dashboard() {
  const { data: postsData } = usePosts()
  const { data: classroomsData } = useClassrooms()

  const posts = postsData?.data || []
  const classrooms = classroomsData?.data || []
  
  const myPosts = posts.filter(post => post.author.name === '김강사' || post.author.name === '관리자')
  const totalLikes = myPosts.reduce((sum, post) => sum + post.likesCount, 0)
  const myClassrooms = classrooms.filter(classroom => classroom.owner.name === '김강사' || classroom.owner.name === '관리자')
  const totalStudents = myClassrooms.reduce((sum, classroom) => sum + (classroom._count?.memberships || 0), 0)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="w-5 h-5" />
      case 'comment': return <MessageCircle className="w-5 h-5" />
      case 'like': return <Heart className="w-5 h-5" />
      case 'classroom_create': return <Plus className="w-5 h-5" />
      case 'join': return <Users className="w-5 h-5" />
      default: return <BookOpen className="w-5 h-5" />
    }
  }

  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'upload': return '학습자료 업로드'
      case 'comment': return '댓글 작성'
      case 'like': return '좋아요'
      case 'classroom_create': return '강의실 개설'
      case 'join': return '강의실 참여'
      default: return '활동'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          나의 활동
        </h1>
        <p className="text-gray-600 text-lg">
          최근 활동과 학습 현황을 확인하세요
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">업로드한 자료</p>
              <p className="text-2xl font-bold text-gray-900">{myPosts.length}</p>
              <p className="text-xs text-gray-500">총 좋아요 {totalLikes}개</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">개설한 강의실</p>
              <p className="text-2xl font-bold text-gray-900">{myClassrooms.length}</p>
              <p className="text-xs text-gray-500">총 학생 {totalStudents}명</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">수강중인 강의실</p>
              <p className="text-2xl font-bold text-gray-900">{classrooms.length - myClassrooms.length}</p>
              <p className="text-xs text-gray-500">활발히 참여중</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">최근 활동</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {getActivityTitle(activity.type)}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{activity.timestamp}</span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                  
                  {activity.content && (
                    <p className="text-gray-600 text-sm mb-2">"{activity.content}"</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {activity.likes && <span>❤️ {activity.likes}개 좋아요</span>}
                    {activity.students && <span>👥 {activity.students}명 참여</span>}
                    {activity.instructor && <span>👨‍🏫 {activity.instructor}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors">
            <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <span className="text-sm font-medium">자료 업로드</span>
          </button>
          <button className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors">
            <Plus className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <span className="text-sm font-medium">강의실 개설</span>
          </button>
          <button className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <span className="text-sm font-medium">학생 관리</span>
          </button>
          <button className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors">
            <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <span className="text-sm font-medium">통계 보기</span>
          </button>
        </div>
      </div>
    </div>
  )
}