import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // 통계 정보
  stats: {
    postsCount: number;
    filesCount: number;
    likesGiven: number;
    likesReceived: number;
    classroomsOwned: number;
    classroomsJoined: number;
    classroomsLiked: number;
    messagesCount: number;
  };
}

export interface UserActivity {
  posts: Array<{
    id: string;
    title: string;
    content?: string;
    type: string;
    fileUrl?: string;
    fileName?: string;
    likesCount: number;
    viewsCount: number;
    createdAt: Date;
    classroom?: {
      id: string;
      name: string;
    };
  }>;
  
  likedPosts: Array<{
    id: string;
    title: string;
    content?: string;
    type: string;
    fileUrl?: string;
    fileName?: string;
    likesCount: number;
    viewsCount: number;
    createdAt: Date;
    likedAt: Date;
    author: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
    classroom?: {
      id: string;
      name: string;
    };
  }>;
  
  likedClassrooms: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    level: string;
    likesCount: number;
    memberCount: number;
    postsCount: number;
    likedAt: Date;
    owner: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
  
  uploadedFiles: Array<{
    id: string;
    title: string;
    description?: string;
    fileName: string;
    originalName: string;
    type: string;
    size: number;
    url: string;
    viewsCount: number;
    createdAt: Date;
    category?: {
      id: string;
      name: string;
      color?: string;
    };
  }>;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export class UserProfileService {
  // 사용자 프로필 조회
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              posts: true,
              uploadedFiles: true,
              likes: true,
              classroomLikes: true,
              ownedClassrooms: true,
              memberships: true,
              messages: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 받은 좋아요 수 계산
      const likesReceived = await prisma.like.count({
        where: {
          post: {
            authorId: userId
          }
        }
      });

      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl || undefined,
        bio: undefined,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats: {
          postsCount: user._count.posts,
          filesCount: user._count.uploadedFiles,
          likesGiven: user._count.likes,
          likesReceived,
          classroomsOwned: user._count.ownedClassrooms,
          classroomsJoined: user._count.memberships,
          classroomsLiked: user._count.classroomLikes,
          messagesCount: user._count.messages
        }
      };

      logger.info(`사용자 프로필 조회: ${userId}`);
      return profile;

    } catch (error) {
      logger.error('사용자 프로필 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 활동 조회
  async getUserActivity(userId: string): Promise<UserActivity> {
    try {
      // 사용자 게시물
      const posts = await prisma.post.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          fileUrl: true,
          fileName: true,
          likesCount: true,
          viewsCount: true,
          createdAt: true,
          classroom: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // 좋아요한 게시물
      const likedPosts = await prisma.like.findMany({
        where: { userId },
        select: {
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              type: true,
              fileUrl: true,
              fileName: true,
              likesCount: true,
              viewsCount: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              },
              classroom: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // 좋아요한 강의실
      const likedClassrooms = await prisma.classroomLike.findMany({
        where: { userId },
        select: {
          createdAt: true,
          classroom: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              level: true,
              likesCount: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              },
              _count: {
                select: {
                  memberships: true,
                  posts: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // 업로드한 파일
      const uploadedFiles = await prisma.file.findMany({
        where: { uploadedById: userId },
        select: {
          id: true,
          title: true,
          description: true,
          fileName: true,
          originalName: true,
          type: true,
          size: true,
          url: true,
          viewsCount: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      const activity: UserActivity = {
        posts: posts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content || undefined,
          type: post.type,
          fileUrl: post.fileUrl || undefined,
          fileName: post.fileName || undefined,
          likesCount: post.likesCount,
          viewsCount: post.viewsCount,
          createdAt: post.createdAt,
          classroom: post.classroom ? {
            id: post.classroom.id,
            name: post.classroom.name
          } : undefined
        })),
        
        likedPosts: likedPosts.map(like => ({
          id: like.post.id,
          title: like.post.title,
          content: like.post.content || undefined,
          type: like.post.type,
          fileUrl: like.post.fileUrl || undefined,
          fileName: like.post.fileName || undefined,
          likesCount: like.post.likesCount,
          viewsCount: like.post.viewsCount,
          createdAt: like.post.createdAt,
          likedAt: like.createdAt,
          author: {
            id: like.post.author.id,
            name: like.post.author.name,
            avatarUrl: like.post.author.avatarUrl || undefined
          },
          classroom: like.post.classroom ? {
            id: like.post.classroom.id,
            name: like.post.classroom.name
          } : undefined
        })),
        
        likedClassrooms: likedClassrooms.map(like => ({
          id: like.classroom.id,
          name: like.classroom.name,
          description: like.classroom.description || undefined,
          category: like.classroom.category,
          level: like.classroom.level,
          likesCount: like.classroom.likesCount,
          memberCount: like.classroom._count.memberships,
          postsCount: like.classroom._count.posts,
          likedAt: like.createdAt,
          owner: {
            id: like.classroom.owner.id,
            name: like.classroom.owner.name,
            avatarUrl: like.classroom.owner.avatarUrl || undefined
          }
        })),
        
        uploadedFiles: uploadedFiles.map(file => ({
          id: file.id,
          title: file.title,
          description: file.description || undefined,
          fileName: file.fileName,
          originalName: file.originalName,
          type: file.type,
          size: file.size,
          url: file.url,
          viewsCount: file.viewsCount,
          createdAt: file.createdAt,
          category: file.category ? {
            id: file.category.id,
            name: file.category.name,
            color: file.category.color || undefined
          } : undefined
        }))
      };

      logger.info(`사용자 활동 조회: ${userId}`);
      return activity;

    } catch (error) {
      logger.error('사용자 활동 조회 실패:', error);
      throw error;
    }
  }

  // 프로필 업데이트
  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
          updatedAt: new Date()
        }
      });

      logger.info(`사용자 프로필 업데이트: ${userId}`);
      
      // 업데이트된 프로필 반환
      return this.getUserProfile(userId);

    } catch (error) {
      logger.error('사용자 프로필 업데이트 실패:', error);
      throw error;
    }
  }

  // 강의실 좋아요 토글
  async toggleClassroomLike(userId: string, classroomId: string): Promise<{
    liked: boolean;
    likesCount: number;
  }> {
    try {
      const existingLike = await prisma.classroomLike.findUnique({
        where: {
          userId_classroomId: {
            userId,
            classroomId
          }
        }
      });

      if (existingLike) {
        // 좋아요 취소
        await prisma.classroomLike.delete({
          where: {
            userId_classroomId: {
              userId,
              classroomId
            }
          }
        });

        await prisma.classroom.update({
          where: { id: classroomId },
          data: {
            likesCount: {
              decrement: 1
            }
          }
        });

        const classroom = await prisma.classroom.findUnique({
          where: { id: classroomId },
          select: { likesCount: true }
        });

        logger.info(`강의실 좋아요 취소: ${userId} -> ${classroomId}`);
        return {
          liked: false,
          likesCount: classroom?.likesCount || 0
        };

      } else {
        // 좋아요 추가
        await prisma.classroomLike.create({
          data: {
            userId,
            classroomId
          }
        });

        await prisma.classroom.update({
          where: { id: classroomId },
          data: {
            likesCount: {
              increment: 1
            }
          }
        });

        const classroom = await prisma.classroom.findUnique({
          where: { id: classroomId },
          select: { likesCount: true }
        });

        logger.info(`강의실 좋아요 추가: ${userId} -> ${classroomId}`);
        return {
          liked: true,
          likesCount: classroom?.likesCount || 0
        };
      }

    } catch (error) {
      logger.error('강의실 좋아요 토글 실패:', error);
      throw error;
    }
  }

  // 게시물 좋아요 토글
  async togglePostLike(userId: string, postId: string): Promise<{
    liked: boolean;
    likesCount: number;
  }> {
    try {
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      });

      if (existingLike) {
        // 좋아요 취소
        await prisma.like.delete({
          where: {
            userId_postId: {
              userId,
              postId
            }
          }
        });

        await prisma.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              decrement: 1
            }
          }
        });

        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { likesCount: true }
        });

        logger.info(`게시물 좋아요 취소: ${userId} -> ${postId}`);
        return {
          liked: false,
          likesCount: post?.likesCount || 0
        };

      } else {
        // 좋아요 추가
        await prisma.like.create({
          data: {
            userId,
            postId
          }
        });

        await prisma.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              increment: 1
            }
          }
        });

        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { likesCount: true }
        });

        logger.info(`게시물 좋아요 추가: ${userId} -> ${postId}`);
        return {
          liked: true,
          likesCount: post?.likesCount || 0
        };
      }

    } catch (error) {
      logger.error('게시물 좋아요 토글 실패:', error);
      throw error;
    }
  }
}

export const userProfileService = new UserProfileService();
