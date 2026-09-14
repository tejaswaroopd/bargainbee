import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadFile } from '../services/storageService';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// POST /api/bulk/upload - Corporate bulk voucher ingestion
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  const { companyName } = req.body;
  if (!companyName) throw new AppError('Company name is required', 400);
  if (!req.file) throw new AppError('CSV / Excel file is required', 400);

  const fileUrl = await uploadFile(req.file.buffer, req.file.originalname, 'bulk-uploads');

  const bulkUpload = await prisma.bulkUpload.create({
    data: {
      companyName,
      uploadedById: req.user!.id,
      fileUrl,
      status: 'PROCESSING',
      totalCount: 15,
      processedCount: 0,
    },
  });

  // Simulate async background voucher creation for corporate seller
  setTimeout(async () => {
    try {
      await prisma.bulkUpload.update({
        where: { id: bulkUpload.id },
        data: { status: 'COMPLETED', processedCount: 15 },
      });
    } catch {
      // Ignore background simulation errors
    }
  }, 3000);

  res.status(201).json({
    bulkUpload,
    message: 'File uploaded successfully. Processing vouchers in background queue.',
  });
});

// GET /api/bulk/my
router.get('/my', async (req: AuthRequest, res: Response) => {
  const uploads = await prisma.bulkUpload.findMany({
    where: { uploadedById: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ uploads });
});

export default router;
