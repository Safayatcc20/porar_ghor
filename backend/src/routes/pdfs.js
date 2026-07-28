import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { uploadPdf, getSignedUrl, deletePdf } from '../lib/storage.js';

const router = Router();
const prisma = new PrismaClient();

// Store in memory then push to Supabase (max 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// POST /api/pdfs/upload
router.post('/upload', requireAuth, upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const storagePath = `${req.userId}/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  await uploadPdf(req.file.buffer, storagePath);

  const numPages = parseInt(req.body.numPages) || 0;
  const pdf = await prisma.pdf.create({
    data: {
      name: req.file.originalname.replace(/\.pdf$/i, ''),
      storagePath,
      size: req.file.size,
      numPages,
      userId: req.userId,
    },
  });

  res.status(201).json(pdf);
});

// GET /api/pdfs
router.get('/', requireAuth, async (req, res) => {
  const pdfs = await prisma.pdf.findMany({
    where: { userId: req.userId },
    orderBy: { openedAt: 'desc' },
    select: {
      id: true, name: true, size: true,
      numPages: true, lastPage: true,
      createdAt: true, openedAt: true,
    },
  });
  res.json(pdfs);
});

// GET /api/pdfs/:id/url  — signed download URL (1 hour)
router.get('/:id/url', requireAuth, async (req, res) => {
  const pdf = await prisma.pdf.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!pdf) return res.status(404).json({ error: 'PDF not found' });

  // update openedAt
  await prisma.pdf.update({
    where: { id: pdf.id },
    data: { openedAt: new Date() },
  });

  const url = await getSignedUrl(pdf.storagePath, 3600);
  res.json({ url });
});

// PATCH /api/pdfs/:id/progress
router.patch('/:id/progress', requireAuth, async (req, res) => {
  const schema = z.object({ lastPage: z.number().int().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid page number' });

  const pdf = await prisma.pdf.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!pdf) return res.status(404).json({ error: 'PDF not found' });

  const updated = await prisma.pdf.update({
    where: { id: pdf.id },
    data: { lastPage: parsed.data.lastPage },
  });
  res.json(updated);
});

// DELETE /api/pdfs/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const pdf = await prisma.pdf.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!pdf) return res.status(404).json({ error: 'PDF not found' });

  await deletePdf(pdf.storagePath);
  await prisma.pdf.delete({ where: { id: pdf.id } });
  res.json({ success: true });
});

export default router;
