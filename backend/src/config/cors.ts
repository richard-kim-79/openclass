export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://openclass-production.vercel.app',
      'https://*.vercel.app',
    ];

    // 개발 환경에서는 모든 localhost 허용
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:*');
    }

    // 환경 변수로 추가 도메인 설정
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }

    if (!origin || allowedOrigins.some(allowed => 
      allowed.includes('*') ? 
        origin.match(allowed.replace('*', '.*')) : 
        origin === allowed
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24시간
};
