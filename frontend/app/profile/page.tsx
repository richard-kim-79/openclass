'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Calendar, 
  Mail, 
  Heart, 
  FileText, 
  Upload, 
  Users, 
  MessageCircle,
  ExternalLink,
  Download,
  Eye,
  ThumbsUp,
  BookOpen,
  Star,
  Grid,
  List,
  Settings,
  Camera
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileWithActivity, useUpdateProfile, useTogglePostLike, useToggleClassroomLike } from '@/hooks/useProfile';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'liked-posts' | 'liked-classrooms' | 'files'>('posts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    avatarUrl: ''
  });

  const { profile, activity, isLoading, error, refetch } = useProfileWithActivity();
  const updateProfileMutation = useUpdateProfile();
  const togglePostLikeMutation = useTogglePostLike();
  const toggleClassroomLikeMutation = useToggleClassroomLike();

  // 인증 확인
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // 편집 모드 시작
  const handleEditStart = () => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || ''
      });
      setIsEditing(true);
    }
  };

  // 편집 저장
  const handleEditSave = async () => {
    try {
      await updateProfileMutation.mutateAsync(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  };

  // 편집 취소
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: '',
      bio: '',
      avatarUrl: ''
    });
  };

  // 게시물 좋아요 토글
  const handlePostLike = async (postId: string) => {
    try {
      await togglePostLikeMutation.mutateAsync(postId);
    } catch (error) {
      console.error('게시물 좋아요 실패:', error);
    }
  };

  // 강의실 좋아요 토글
  const handleClassroomLike = async (classroomId: string) => {
    try {
      await toggleClassroomLikeMutation.mutateAsync(classroomId);
    } catch (error) {
      console.error('강의실 좋아요 실패:', error);
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 상대적 시간 포맷팅
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`;
    return formatDate(dateString);
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">프로필을 불러오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 프로필 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            {/* 아바타 */}
            <div className="relative">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="text-2xl font-bold border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    placeholder="이름"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="자기소개를 입력하세요..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      저장
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      <X className="w-4 h-4" />
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {profile?.role}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {profile?.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(profile?.createdAt || '')} 가입
                    </div>
                  </div>
                  
                  {profile?.bio && (
                    <p className="text-gray-600 mb-4">{profile.bio}</p>
                  )}
                  
                  <button
                    onClick={handleEditStart}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Edit className="w-4 h-4" />
                    프로필 편집
                  </button>
                </div>
              )}
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{profile?.stats.postsCount}</div>
                <div className="text-sm text-gray-600">게시물</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{profile?.stats.likesReceived}</div>
                <div className="text-sm text-gray-600">받은 좋아요</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{profile?.stats.classroomsJoined}</div>
                <div className="text-sm text-gray-600">참여 강의실</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{profile?.stats.filesCount}</div>
                <div className="text-sm text-gray-600">업로드 파일</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  내 게시물 ({activity?.posts.length || 0})
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('liked-posts')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'liked-posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  좋아요한 게시물 ({activity?.likedPosts.length || 0})
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('liked-classrooms')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'liked-classrooms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  좋아요한 강의실 ({activity?.likedClassrooms.length || 0})
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('files')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  업로드 파일 ({activity?.uploadedFiles.length || 0})
                </div>
              </button>
            </div>

            {/* 보기 모드 선택 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 내 게시물 */}
        {activeTab === 'posts' && (
          <div>
            {activity?.posts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 게시물이 없습니다</h3>
                <p className="text-gray-500">첫 번째 게시물을 작성해보세요!</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {activity?.posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {post.type}
                      </span>
                    </div>
                    
                    {post.content && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.content}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {post.likesCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.viewsCount}
                        </div>
                      </div>
                      <div>{formatRelativeTime(post.createdAt)}</div>
                    </div>
                    
                    {post.classroom && (
                      <div className="mt-4 text-sm text-blue-600">
                        📚 {post.classroom.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 좋아요한 게시물 */}
        {activeTab === 'liked-posts' && (
          <div>
            {activity?.likedPosts.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">좋아요한 게시물이 없습니다</h3>
                <p className="text-gray-500">마음에 드는 게시물에 좋아요를 눌러보세요!</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {activity?.likedPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
                      <button
                        onClick={() => handlePostLike(post.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                    
                    {post.content && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.content}</p>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                      {post.author.avatarUrl ? (
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-600" />
                        </div>
                      )}
                      <span className="text-sm text-gray-700">{post.author.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {post.likesCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.viewsCount}
                        </div>
                      </div>
                      <div>{formatRelativeTime(post.likedAt)}</div>
                    </div>
                    
                    {post.classroom && (
                      <div className="mt-4 text-sm text-blue-600">
                        📚 {post.classroom.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 좋아요한 강의실 */}
        {activeTab === 'liked-classrooms' && (
          <div>
            {activity?.likedClassrooms.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">좋아요한 강의실이 없습니다</h3>
                <p className="text-gray-500">관심 있는 강의실에 좋아요를 눌러보세요!</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {activity?.likedClassrooms.map((classroom) => (
                  <div key={classroom.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{classroom.name}</h3>
                      <button
                        onClick={() => handleClassroomLike(classroom.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                    
                    {classroom.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{classroom.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {classroom.category}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {classroom.level}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      {classroom.owner.avatarUrl ? (
                        <img
                          src={classroom.owner.avatarUrl}
                          alt={classroom.owner.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-600" />
                        </div>
                      )}
                      <span className="text-sm text-gray-700">{classroom.owner.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {classroom.memberCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {classroom.postsCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {classroom.likesCount}
                        </div>
                      </div>
                      <div>{formatRelativeTime(classroom.likedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 업로드 파일 */}
        {activeTab === 'files' && (
          <div>
            {activity?.uploadedFiles.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">업로드한 파일이 없습니다</h3>
                <p className="text-gray-500">첫 번째 파일을 업로드해보세요!</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {activity?.uploadedFiles.map((file) => (
                  <div key={file.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{file.title}</h3>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                    
                    {file.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{file.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {file.type}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {formatFileSize(file.size)}
                      </span>
                      {file.category && (
                        <span 
                          className="px-2 py-1 text-xs rounded text-white"
                          style={{ backgroundColor: file.category.color }}
                        >
                          {file.category.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {file.viewsCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          {file.fileName}
                        </div>
                      </div>
                      <div>{formatRelativeTime(file.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
