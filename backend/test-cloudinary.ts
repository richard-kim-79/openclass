import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinaryConnection() {
  console.log('🔍 Cloudinary 연결 테스트 시작...');
  console.log('');
  
  try {
    // 환경 변수 확인
    console.log('📋 설정 정보:');
    console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME || '❌ 없음'}`);
    console.log(`API Key: ${process.env.CLOUDINARY_API_KEY ? '✅ 설정됨' : '❌ 없음'}`);
    console.log(`API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✅ 설정됨' : '❌ 없음'}`);
    console.log('');
    
    // API 연결 테스트
    console.log('🌐 Cloudinary API 연결 테스트...');
    const result = await cloudinary.api.resources({
      resource_type: 'image',
      max_results: 1
    });
    
    console.log('✅ Cloudinary 연결 성공!');
    console.log(`📊 현재 리소스 수: ${result.total_count || 0}개`);
    console.log(`💾 사용 중인 용량: ${((result.total_bytes || 0) / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    
    // 업로드 테스트 (작은 텍스트 파일)
    console.log('📤 업로드 테스트...');
    const uploadResult = await cloudinary.uploader.upload(
      'data:text/plain;base64,' + Buffer.from('OpenClass Test File').toString('base64'),
      {
        folder: 'openclass/test',
        public_id: `test_${Date.now()}`,
        resource_type: 'raw'
      }
    );
    
    console.log('✅ 업로드 테스트 성공!');
    console.log(`📁 업로드된 파일 URL: ${uploadResult.secure_url}`);
    console.log('');
    
    // 테스트 파일 삭제
    await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'raw' });
    console.log('🗑️ 테스트 파일 삭제 완료');
    console.log('');
    
    console.log('🎉 모든 테스트 통과! Cloudinary 연동이 완료되었습니다.');
    console.log('');
    console.log('💡 이제 OpenClass에서 파일 업로드 기능을 사용할 수 있습니다:');
    console.log('   1. 백엔드 서버 시작: cd backend && npm run dev');
    console.log('   2. 프론트엔드 서버 시작: cd frontend && npm run dev');
    console.log('   3. http://localhost:3000/upload 에서 파일 업로드 테스트');
    
  } catch (error: any) {
    console.error('❌ Cloudinary 연결 실패:');
    console.log('');
    
    if (error.message.includes('Must supply api_key')) {
      console.error('🔑 API Key가 설정되지 않았습니다.');
      console.log('💡 .env 파일에서 CLOUDINARY_API_KEY를 확인하세요.');
    } else if (error.message.includes('Must supply cloud_name')) {
      console.error('☁️ Cloud Name이 설정되지 않았습니다.');
      console.log('💡 .env 파일에서 CLOUDINARY_CLOUD_NAME을 확인하세요.');
    } else if (error.message.includes('Must supply api_secret')) {
      console.error('🔐 API Secret이 설정되지 않았습니다.');
      console.log('💡 .env 파일에서 CLOUDINARY_API_SECRET을 확인하세요.');
    } else if (error.message.includes('Invalid API key') || error.http_code === 401) {
      console.error('🚫 잘못된 API 키입니다.');
      console.log('💡 Cloudinary 대시보드에서 API 정보를 다시 확인하세요.');
      console.log('   👉 https://console.cloudinary.com');
    } else {
      console.error('❓ 알 수 없는 오류:', error.message);
      console.log('🔍 자세한 정보:', error);
    }
    
    console.log('');
    console.log('🔧 해결 방법:');
    console.log('1. https://console.cloudinary.com 에서 API 정보 재확인');
    console.log('2. backend/.env 파일에 올바른 값 설정');
    console.log('3. 서버 재시작');
    
    process.exit(1);
  }
}

testCloudinaryConnection();
