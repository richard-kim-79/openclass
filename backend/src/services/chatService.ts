import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  classroomId: string;
  type: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  replyToId?: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    isOnline: boolean;
  };
  replyTo?: {
    id: string;
    content: string;
    author: {
      name: string;
    };
  };
  reads: {
    userId: string;
    readAt: Date;
  }[];
  reactions: {
    userId: string;
    emoji: string;
    user: {
      name: string;
    };
  }[];
}

export interface CreateMessageData {
  content: string;
  authorId: string;
  classroomId: string;
  type?: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
}

export interface UpdateMessageData {
  content?: string;
  isEdited?: boolean;
  editedAt?: Date;
}

export class ChatService {
  // 메시지 생성
  async createMessage(data: CreateMessageData): Promise<ChatMessage> {
    try {
      // 강의실 멤버십 확인
      const membership = await prisma.classroomMembership.findFirst({
        where: {
          userId: data.authorId,
          classroomId: data.classroomId
        }
      });

      if (!membership) {
        throw new Error('강의실에 참여하지 않은 사용자입니다.');
      }

      const message = await prisma.message.create({
        data: {
          content: data.content,
          authorId: data.authorId,
          classroomId: data.classroomId,
          type: data.type || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          replyToId: data.replyToId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isOnline: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  name: true
                }
              }
            }
          },
          reads: {
            select: {
              userId: true,
              readAt: true
            }
          },
          reactions: {
            select: {
              userId: true,
              emoji: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      logger.info(`메시지 생성됨: ${message.id}`, {
        authorId: data.authorId,
        classroomId: data.classroomId,
        type: data.type
      });

      return {
        ...message,
        type: message.type as 'text' | 'file' | 'image' | 'system',
        fileUrl: message.fileUrl || undefined,
        fileName: message.fileName || undefined,
        fileSize: message.fileSize || undefined,
        replyToId: message.replyToId || undefined,
        editedAt: message.editedAt || undefined,
        deletedAt: message.deletedAt || undefined,
        author: {
          ...message.author,
          avatarUrl: message.author.avatarUrl || undefined
        },
        replyTo: message.replyTo ? {
          ...message.replyTo,
          author: message.replyTo.author
        } : undefined
      };
    } catch (error) {
      logger.error('메시지 생성 실패:', error);
      throw error;
    }
  }

  // 메시지 목록 조회
  async getMessages(
    classroomId: string,
    userId: string,
    limit: number = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    try {
      // 강의실 멤버십 확인
      const membership = await prisma.classroomMembership.findFirst({
        where: {
          userId,
          classroomId
        }
      });

      if (!membership) {
        throw new Error('강의실에 참여하지 않은 사용자입니다.');
      }

      const messages = await prisma.message.findMany({
        where: {
          classroomId,
          isDeleted: false,
          ...(before && {
            createdAt: {
              lt: new Date(before)
            }
          })
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isOnline: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  name: true
                }
              }
            }
          },
          reads: {
            select: {
              userId: true,
              readAt: true
            }
          },
          reactions: {
            select: {
              userId: true,
              emoji: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return messages.reverse().map(message => ({
        ...message,
        type: message.type as 'text' | 'file' | 'image' | 'system',
        fileUrl: message.fileUrl || undefined,
        fileName: message.fileName || undefined,
        fileSize: message.fileSize || undefined,
        replyToId: message.replyToId || undefined,
        editedAt: message.editedAt || undefined,
        deletedAt: message.deletedAt || undefined,
        author: {
          ...message.author,
          avatarUrl: message.author.avatarUrl || undefined
        },
        replyTo: message.replyTo ? {
          ...message.replyTo,
          author: message.replyTo.author
        } : undefined
      }));
    } catch (error) {
      logger.error('메시지 조회 실패:', error);
      throw error;
    }
  }

  // 메시지 수정
  async updateMessage(
    messageId: string,
    authorId: string,
    data: UpdateMessageData
  ): Promise<ChatMessage> {
    try {
      // 작성자 확인
      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
        select: { authorId: true }
      });

      if (!existingMessage) {
        throw new Error('메시지를 찾을 수 없습니다.');
      }

      if (existingMessage.authorId !== authorId) {
        throw new Error('메시지 수정 권한이 없습니다.');
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          ...data,
          isEdited: true,
          editedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isOnline: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  name: true
                }
              }
            }
          },
          reads: {
            select: {
              userId: true,
              readAt: true
            }
          },
          reactions: {
            select: {
              userId: true,
              emoji: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      logger.info(`메시지 수정됨: ${messageId}`, { authorId });

      return {
        ...updatedMessage,
        type: updatedMessage.type as 'text' | 'file' | 'image' | 'system',
        fileUrl: updatedMessage.fileUrl || undefined,
        fileName: updatedMessage.fileName || undefined,
        fileSize: updatedMessage.fileSize || undefined,
        editedAt: updatedMessage.editedAt || undefined,
        deletedAt: updatedMessage.deletedAt || undefined,
        replyToId: updatedMessage.replyToId || undefined,
        author: {
          ...updatedMessage.author,
          avatarUrl: updatedMessage.author.avatarUrl || undefined
        },
        replyTo: updatedMessage.replyTo ? {
          ...updatedMessage.replyTo,
          author: updatedMessage.replyTo.author
        } : undefined
      };
    } catch (error) {
      logger.error('메시지 수정 실패:', error);
      throw error;
    }
  }

  // 메시지 삭제
  async deleteMessage(messageId: string, authorId: string): Promise<void> {
    try {
      // 작성자 확인
      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
        select: { authorId: true }
      });

      if (!existingMessage) {
        throw new Error('메시지를 찾을 수 없습니다.');
      }

      if (existingMessage.authorId !== authorId) {
        throw new Error('메시지 삭제 권한이 없습니다.');
      }

      await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          content: '삭제된 메시지입니다.'
        }
      });

      logger.info(`메시지 삭제됨: ${messageId}`, { authorId });
    } catch (error) {
      logger.error('메시지 삭제 실패:', error);
      throw error;
    }
  }

  // 메시지 읽음 처리
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      await prisma.messageRead.upsert({
        where: {
          userId_messageId: {
            userId,
            messageId
          }
        },
        update: {
          readAt: new Date()
        },
        create: {
          userId,
          messageId,
          readAt: new Date()
        }
      });

      logger.info(`메시지 읽음 처리: ${messageId}`, { userId });
    } catch (error) {
      logger.error('메시지 읽음 처리 실패:', error);
      throw error;
    }
  }

  // 메시지 반응 추가/제거
  async toggleMessageReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<{ added: boolean; reactionCount: number }> {
    try {
      const existingReaction = await prisma.messageReaction.findUnique({
        where: {
          userId_messageId_emoji: {
            userId,
            messageId,
            emoji
          }
        }
      });

      if (existingReaction) {
        // 반응 제거
        await prisma.messageReaction.delete({
          where: {
            userId_messageId_emoji: {
              userId,
              messageId,
              emoji
            }
          }
        });

        const reactionCount = await prisma.messageReaction.count({
          where: { messageId, emoji }
        });

        logger.info(`메시지 반응 제거: ${messageId}`, { userId, emoji });
        return { added: false, reactionCount };
      } else {
        // 반응 추가
        await prisma.messageReaction.create({
          data: {
            userId,
            messageId,
            emoji
          }
        });

        const reactionCount = await prisma.messageReaction.count({
          where: { messageId, emoji }
        });

        logger.info(`메시지 반응 추가: ${messageId}`, { userId, emoji });
        return { added: true, reactionCount };
      }
    } catch (error) {
      logger.error('메시지 반응 토글 실패:', error);
      throw error;
    }
  }

  // 사용자 온라인 상태 업데이트
  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline,
          lastSeenAt: new Date()
        }
      });

      logger.info(`사용자 온라인 상태 업데이트: ${userId}`, { isOnline });
    } catch (error) {
      logger.error('사용자 온라인 상태 업데이트 실패:', error);
      throw error;
    }
  }

  // 강의실 온라인 사용자 목록 조회
  async getOnlineUsers(classroomId: string): Promise<Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    isOnline: boolean;
    lastSeenAt?: Date;
  }>> {
    try {
      const members = await prisma.classroomMembership.findMany({
        where: { classroomId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isOnline: true,
              lastSeenAt: true
            }
          }
        }
      });

      return members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        avatarUrl: member.user.avatarUrl || undefined,
        isOnline: member.user.isOnline,
        lastSeenAt: member.user.lastSeenAt || undefined
      }));
    } catch (error) {
      logger.error('온라인 사용자 조회 실패:', error);
      throw error;
    }
  }

  // 강의실 안읽은 메시지 수 조회
  async getUnreadMessageCount(classroomId: string, userId: string): Promise<number> {
    try {
      // 사용자가 마지막으로 읽은 메시지 시간 조회
      const lastReadMessage = await prisma.messageRead.findFirst({
        where: {
          userId,
          message: {
            classroomId
          }
        },
        orderBy: {
          readAt: 'desc'
        },
        select: {
          readAt: true
        }
      });

      // 마지막 읽은 시간 이후의 메시지 수 계산
      const unreadCount = await prisma.message.count({
        where: {
          classroomId,
          isDeleted: false,
          authorId: { not: userId }, // 본인이 보낸 메시지는 제외
          createdAt: {
            gt: lastReadMessage?.readAt || new Date(0)
          }
        }
      });

      return unreadCount;
    } catch (error) {
      logger.error('안읽은 메시지 수 조회 실패:', error);
      return 0;
    }
  }
}

export const chatService = new ChatService();
