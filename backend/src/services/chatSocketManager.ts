import { Server, Socket } from 'socket.io';
import { verifyAccessToken, extractToken } from '../utils/auth';
import { chatService } from '../services/chatService';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 소켓 연결 관리
interface UserSocket {
  userId: string;
  userName: string;
  classroomId?: string;
  socket: Socket;
}

class ChatSocketManager {
  private io: Server;
  private connectedUsers: Map<string, UserSocket> = new Map();
  private roomUsers: Map<string, Set<string>> = new Map(); // classroomId -> Set of userIds

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', async (socket: Socket) => {
      try {
        // 인증 확인
        const token = extractToken(socket.handshake.auth.token);
        if (!token) {
          socket.emit('error', { message: '인증 토큰이 필요합니다.' });
          socket.disconnect();
          return;
        }

        const decoded = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            name: true,
            isActive: true
          }
        });

        if (!user || !user.isActive) {
          socket.emit('error', { message: '유효하지 않은 사용자입니다.' });
          socket.disconnect();
          return;
        }

        // 사용자 연결 정보 저장
        const userSocket: UserSocket = {
          userId: user.id,
          userName: user.name,
          socket
        };

        this.connectedUsers.set(socket.id, userSocket);

        // 사용자 온라인 상태 업데이트
        await chatService.updateUserOnlineStatus(user.id, true);

        logger.info(`사용자 연결됨: ${user.name} (${user.id})`, { socketId: socket.id });

        // 소켓 이벤트 핸들러 등록
        this.registerSocketEvents(socket, userSocket);

        // 연결 성공 알림
        socket.emit('connected', {
          userId: user.id,
          userName: user.name,
          message: '채팅 서버에 연결되었습니다.'
        });

      } catch (error) {
        logger.error('소켓 연결 오류:', error);
        socket.emit('error', { message: '연결 중 오류가 발생했습니다.' });
        socket.disconnect();
      }
    });
  }

  private registerSocketEvents(socket: Socket, userSocket: UserSocket) {
    // 강의실 입장
    socket.on('join_classroom', async (data: { classroomId: string }) => {
      try {
        const { classroomId } = data;

        // 강의실 멤버십 확인
        const membership = await prisma.classroomMembership.findFirst({
          where: {
            userId: userSocket.userId,
            classroomId
          }
        });

        if (!membership) {
          socket.emit('error', { message: '강의실에 참여하지 않은 사용자입니다.' });
          return;
        }

        // 이전 강의실에서 나가기
        if (userSocket.classroomId) {
          socket.leave(userSocket.classroomId);
          this.removeUserFromRoom(userSocket.classroomId, userSocket.userId);
        }

        // 새 강의실 입장
        socket.join(classroomId);
        userSocket.classroomId = classroomId;
        this.addUserToRoom(classroomId, userSocket.userId);

        // 강의실 사용자들에게 입장 알림
        socket.to(classroomId).emit('user_joined', {
          userId: userSocket.userId,
          userName: userSocket.userName,
          message: `${userSocket.userName}님이 입장했습니다.`
        });

        // 온라인 사용자 목록 전송
        const onlineUsers = await chatService.getOnlineUsers(classroomId);
        socket.emit('online_users', { onlineUsers });

        logger.info(`사용자 강의실 입장: ${userSocket.userName} -> ${classroomId}`);

      } catch (error) {
        logger.error('강의실 입장 오류:', error);
        socket.emit('error', { message: '강의실 입장 중 오류가 발생했습니다.' });
      }
    });

    // 강의실 퇴장
    socket.on('leave_classroom', () => {
      if (userSocket.classroomId) {
        socket.leave(userSocket.classroomId);
        
        // 퇴장 알림
        socket.to(userSocket.classroomId).emit('user_left', {
          userId: userSocket.userId,
          userName: userSocket.userName,
          message: `${userSocket.userName}님이 퇴장했습니다.`
        });

        this.removeUserFromRoom(userSocket.classroomId, userSocket.userId);
        userSocket.classroomId = undefined;

        logger.info(`사용자 강의실 퇴장: ${userSocket.userName}`);
      }
    });

    // 메시지 전송
    socket.on('send_message', async (data: {
      content: string;
      classroomId: string;
      type?: 'text' | 'file' | 'image';
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      replyToId?: string;
    }) => {
      try {
        const message = await chatService.createMessage({
          ...data,
          authorId: userSocket.userId
        });

        // 강의실 모든 사용자에게 메시지 전송
        this.io.to(data.classroomId).emit('new_message', { message });

        logger.info(`메시지 전송: ${userSocket.userName} -> ${data.classroomId}`);

      } catch (error) {
        logger.error('메시지 전송 오류:', error);
        socket.emit('error', { message: '메시지 전송 중 오류가 발생했습니다.' });
      }
    });

    // 메시지 수정
    socket.on('edit_message', async (data: {
      messageId: string;
      content: string;
    }) => {
      try {
        const message = await chatService.updateMessage(
          data.messageId,
          userSocket.userId,
          { content: data.content }
        );

        // 강의실 모든 사용자에게 수정된 메시지 전송
        if (userSocket.classroomId) {
          this.io.to(userSocket.classroomId).emit('message_edited', { message });
        }

        logger.info(`메시지 수정: ${userSocket.userName} -> ${data.messageId}`);

      } catch (error) {
        logger.error('메시지 수정 오류:', error);
        socket.emit('error', { message: '메시지 수정 중 오류가 발생했습니다.' });
      }
    });

    // 메시지 삭제
    socket.on('delete_message', async (data: { messageId: string }) => {
      try {
        await chatService.deleteMessage(data.messageId, userSocket.userId);

        // 강의실 모든 사용자에게 삭제 알림
        if (userSocket.classroomId) {
          this.io.to(userSocket.classroomId).emit('message_deleted', { 
            messageId: data.messageId 
          });
        }

        logger.info(`메시지 삭제: ${userSocket.userName} -> ${data.messageId}`);

      } catch (error) {
        logger.error('메시지 삭제 오류:', error);
        socket.emit('error', { message: '메시지 삭제 중 오류가 발생했습니다.' });
      }
    });

    // 메시지 읽음 처리
    socket.on('mark_message_read', async (data: { messageId: string }) => {
      try {
        await chatService.markMessageAsRead(data.messageId, userSocket.userId);

        // 강의실 모든 사용자에게 읽음 상태 업데이트
        if (userSocket.classroomId) {
          this.io.to(userSocket.classroomId).emit('message_read', {
            messageId: data.messageId,
            userId: userSocket.userId,
            userName: userSocket.userName
          });
        }

      } catch (error) {
        logger.error('메시지 읽음 처리 오류:', error);
      }
    });

    // 메시지 반응 토글
    socket.on('toggle_reaction', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        const result = await chatService.toggleMessageReaction(
          data.messageId,
          userSocket.userId,
          data.emoji
        );

        // 강의실 모든 사용자에게 반응 업데이트
        if (userSocket.classroomId) {
          this.io.to(userSocket.classroomId).emit('reaction_updated', {
            messageId: data.messageId,
            emoji: data.emoji,
            userId: userSocket.userId,
            userName: userSocket.userName,
            added: result.added,
            reactionCount: result.reactionCount
          });
        }

        logger.info(`메시지 반응 토글: ${userSocket.userName} -> ${data.messageId} (${data.emoji})`);

      } catch (error) {
        logger.error('메시지 반응 토글 오류:', error);
        socket.emit('error', { message: '반응 처리 중 오류가 발생했습니다.' });
      }
    });

    // 타이핑 상태 전송
    socket.on('typing_start', (data: { classroomId: string }) => {
      socket.to(data.classroomId).emit('user_typing', {
        userId: userSocket.userId,
        userName: userSocket.userName,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data: { classroomId: string }) => {
      socket.to(data.classroomId).emit('user_typing', {
        userId: userSocket.userId,
        userName: userSocket.userName,
        isTyping: false
      });
    });

    // 연결 해제
    socket.on('disconnect', async () => {
      try {
        // 강의실에서 퇴장
        if (userSocket.classroomId) {
          socket.to(userSocket.classroomId).emit('user_left', {
            userId: userSocket.userId,
            userName: userSocket.userName,
            message: `${userSocket.userName}님이 퇴장했습니다.`
          });
          
          this.removeUserFromRoom(userSocket.classroomId, userSocket.userId);
        }

        // 연결된 사용자 목록에서 제거
        this.connectedUsers.delete(socket.id);

        // 사용자 오프라인 상태 업데이트
        await chatService.updateUserOnlineStatus(userSocket.userId, false);

        logger.info(`사용자 연결 해제: ${userSocket.userName} (${userSocket.userId})`);

      } catch (error) {
        logger.error('연결 해제 처리 오류:', error);
      }
    });
  }

  private addUserToRoom(classroomId: string, userId: string) {
    if (!this.roomUsers.has(classroomId)) {
      this.roomUsers.set(classroomId, new Set());
    }
    this.roomUsers.get(classroomId)!.add(userId);
  }

  private removeUserFromRoom(classroomId: string, userId: string) {
    const room = this.roomUsers.get(classroomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.roomUsers.delete(classroomId);
      }
    }
  }

  // 특정 강의실에 시스템 메시지 전송
  public sendSystemMessage(classroomId: string, message: string) {
    this.io.to(classroomId).emit('system_message', {
      message,
      timestamp: new Date().toISOString()
    });
  }

  // 특정 사용자에게 개인 메시지 전송
  public sendPrivateMessage(userId: string, message: any) {
    const userSocket = Array.from(this.connectedUsers.values())
      .find(u => u.userId === userId);
    
    if (userSocket) {
      userSocket.socket.emit('private_message', message);
    }
  }
}

export default ChatSocketManager;
