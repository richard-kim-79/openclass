'use client'

import { Brain, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo - hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary-500" />
            <span className="text-xl font-bold text-gray-900">openclass</span>
            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
              개발중
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* User avatar placeholder */}
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
            U
          </div>
        </div>
      </div>
    </header>
  )
}