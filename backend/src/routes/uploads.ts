import express from 'express';
import { imageUpload, documentUpload, fileUpload, cloudinary } from '../config/cloudinary';
import { prisma } from '../index';
import { z } from 'zod';

const router = express.Router();

// 파일 업로드 검증 스키마
const fileUploadSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(100, '제목은 100자 이내여야 합니다'),
  description: z.string().optional(),
  categoryId: z.string().uuid('유효한 카테고리 ID를 입력하세요').optional(),
  tags: z.string().optional(),
});

// 이미지 업로드
router.post('/images', imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일을 선택해주세요.' });
    }

    const validatedData = fileUploadSchema.parse(req.body);
    
    const file = await prisma.file.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: req.file.path,
        cloudinaryId: req.file.filename,
        type: 'IMAGE',
        categoryId: validatedData.categoryId,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags.split(',').map(tag => tag.trim())) : JSON.stringify([]),
      },
    });

    return res.json({
      success: true,
      message: '이미지가 성공적으로 업로드되었습니다.',
      file: {
        id: file.id,
        title: file.title,
        url: file.url,
        type: file.type,
        size: file.size,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error('이미지 업로드 에러:', error);
    
    // 업로드 실패 시 Cloudinary에서 파일 삭제
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error('Cloudinary 파일 삭제 에러:', deleteError);
      }
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    return res.status(500).json({ error: '이미지 업로드 중 오류가 발생했습니다.' });
  }
});

// 문서 업로드
router.post('/documents', documentUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '문서 파일을 선택해주세요.' });
    }

    const validatedData = fileUploadSchema.parse(req.body);
    
    const file = await prisma.file.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: req.file.path,
        cloudinaryId: req.file.filename,
        type: 'DOCUMENT',
        categoryId: validatedData.categoryId,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags.split(',').map(tag => tag.trim())) : JSON.stringify([]),
      },
    });

    return res.json({
      success: true,
      message: '문서가 성공적으로 업로드되었습니다.',
      file: {
        id: file.id,
        title: file.title,
        url: file.url,
        type: file.type,
        size: file.size,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error('문서 업로드 에러:', error);
    
    // 업로드 실패 시 Cloudinary에서 파일 삭제
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'auto' });
      } catch (deleteError) {
        console.error('Cloudinary 파일 삭제 에러:', deleteError);
      }
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    return res.status(500).json({ error: '문서 업로드 중 오류가 발생했습니다.' });
  }
});

// 일반 파일 업로드
router.post('/files', fileUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일을 선택해주세요.' });
    }

    const validatedData = fileUploadSchema.parse(req.body);
    
    // 파일 타입 결정
    let fileType = 'OTHER';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'IMAGE';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'VIDEO';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'AUDIO';
    } else if (req.file.mimetype.includes('pdf') || req.file.mimetype.includes('document')) {
      fileType = 'DOCUMENT';
    }
    
    const file = await prisma.file.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: req.file.path,
        cloudinaryId: req.file.filename,
        type: fileType,
        categoryId: validatedData.categoryId,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags.split(',').map(tag => tag.trim())) : JSON.stringify([]),
      },
    });

    return res.json({
      success: true,
      message: '파일이 성공적으로 업로드되었습니다.',
      file: {
        id: file.id,
        title: file.title,
        url: file.url,
        type: file.type,
        size: file.size,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error('파일 업로드 에러:', error);
    
    // 업로드 실패 시 Cloudinary에서 파일 삭제
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'auto' });
      } catch (deleteError) {
        console.error('Cloudinary 파일 삭제 에러:', deleteError);
      }
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    return res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
  }
});

// 업로드된 파일 목록 조회
router.get('/', async (req, res) => {
  try {
    const { type, categoryId, page = 1, limit = 20 } = req.query;
    
    const where: any = {};
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    
    const files = await prisma.file.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const totalCount = await prisma.file.count({ where });

    return res.json({
      success: true,
      files,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    console.error('파일 목록 조회 에러:', error);
    return res.status(500).json({ error: '파일 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 특정 파일 조회
router.get('/:id', async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    return res.json({
      success: true,
      file,
    });
  } catch (error) {
    console.error('파일 조회 에러:', error);
    return res.status(500).json({ error: '파일을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 파일 삭제
router.delete('/:id', async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // Cloudinary에서 파일 삭제
    if (file.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: 'auto' });
      } catch (cloudinaryError) {
        console.error('Cloudinary 파일 삭제 에러:', cloudinaryError);
      }
    }

    // 데이터베이스에서 파일 삭제
    await prisma.file.delete({
      where: { id: req.params.id },
    });

    return res.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('파일 삭제 에러:', error);
    return res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;
