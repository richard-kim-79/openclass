import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 카테고리 생성
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: '프로그래밍' },
      update: {},
      create: {
        name: '프로그래밍',
        description: '프로그래밍 관련 강의실',
        color: '#3B82F6'
      }
    }),
    prisma.category.upsert({
      where: { name: '디자인' },
      update: {},
      create: {
        name: '디자인',
        description: '디자인 관련 강의실',
        color: '#EF4444'
      }
    }),
    prisma.category.upsert({
      where: { name: '마케팅' },
      update: {},
      create: {
        name: '마케팅',
        description: '마케팅 관련 강의실',
        color: '#10B981'
      }
    })
  ]);

  console.log('✅ 카테고리 생성 완료');

  // 테스트 사용자 생성
  const testUser = await prisma.user.upsert({
    where: { email: 'test@openclass.ai' },
    update: {},
    create: {
      email: 'test@openclass.ai',
      password: '$2b$10$example', // 실제로는 해시된 비밀번호
      name: '테스트 사용자',
      firstName: '테스트',
      lastName: '사용자',
      role: 'student',
      isActive: true,
      isVerified: true
    }
  });

  console.log('✅ 테스트 사용자 생성 완료');

  // 테스트 강의실 생성
  const testClassroom = await prisma.classroom.upsert({
    where: { id: 'test-classroom-1' },
    update: {},
    create: {
      id: 'test-classroom-1',
      name: 'JavaScript 기초',
      description: 'JavaScript의 기본 개념을 배우는 강의실입니다.',
      category: '프로그래밍',
      level: 'beginner',
      ownerId: testUser.id,
      isPublic: true,
      allowChat: true
    }
  });

  console.log('✅ 테스트 강의실 생성 완료');

  // 테스트 게시물 생성
  const testPosts = await Promise.all([
    prisma.post.upsert({
      where: { id: 'test-post-1' },
      update: {},
      create: {
        id: 'test-post-1',
        title: 'JavaScript 변수와 데이터 타입',
        content: 'JavaScript에서 변수를 선언하는 방법과 기본 데이터 타입에 대해 알아봅니다. var, let, const의 차이점과 문자열, 숫자, 불린 등의 타입을 학습합니다.',
        authorId: testUser.id,
        classroomId: testClassroom.id,
        type: 'document',
        tags: JSON.stringify(['JavaScript', '변수', '데이터타입'])
      }
    }),
    prisma.post.upsert({
      where: { id: 'test-post-2' },
      update: {},
      create: {
        id: 'test-post-2',
        title: '함수와 스코프',
        content: 'JavaScript 함수의 정의와 호출 방법, 그리고 스코프의 개념에 대해 학습합니다. 함수 선언문과 함수 표현식의 차이점도 알아봅니다.',
        authorId: testUser.id,
        classroomId: testClassroom.id,
        type: 'document',
        tags: JSON.stringify(['JavaScript', '함수', '스코프'])
      }
    })
  ]);

  console.log('✅ 테스트 게시물 생성 완료');

  console.log('🎉 모든 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });