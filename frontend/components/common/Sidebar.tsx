'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  Search, 
  Upload, 
  Settings, 
  TrendingUp, 
  Plus,
  Users,
  Brain
} from 'lucide-react'

const navigation = [
  { name: '홈', href: '/', icon: BookOpen },
  { name: '대시보드', href: '/dashboard', icon: TrendingUp },
  { name: 'AI 검색', href: '/search', icon: Search },
  { name: '업로드', href: '/upload', icon: Upload },
  { name: '설정', href: '/settings', icon: Settings },
]

const myClassrooms = [
  { id: 1, name: 'React 마스터클래스', isOwner: true },
  { id: 2, name: 'TypeScript 심화', isOwner: true },
]

const enrolledClassrooms = [
  { id: 3, name: 'Python AI 입문', isOwner: false },
  { id: 4, name: 'UX 디자인 실무', isOwner: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo - shown on desktop */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-4 border-b border-gray-200">
        <Brain className="w-6 h-6 text-primary-500" />
        <span className="text-xl font-bold text-gray-900">openclass</span>
        <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
          실제 작동
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isCurrent = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                isCurrent
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100',
                'group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}

        {/* 강의실 개설 버튼 */}
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 mt-4">
          <Plus className="w-5 h-5" />
          강의실 개설
        </button>
      </nav>

      {/* 내가 만든 강의실 */}
      <div className="px-4 py-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">내가 만든 강의실</h3>
        <div className="space-y-1">
          {myClassrooms.map((classroom) => (
            <Link
              key={classroom.id}
              href={`/classroom/${classroom.id}`}
              className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="truncate">{classroom.name}</span>
                <span className="text-xs text-green-600">👑</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 수강중인 강의실 */}
      <div className="px-4 py-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">수강중인 강의실</h3>
        <div className="space-y-1">
          {enrolledClassrooms.map((classroom) => (
            <Link
              key={classroom.id}
              href={`/classroom/${classroom.id}`}
              className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <span className="truncate">{classroom.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}