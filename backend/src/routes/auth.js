import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../lib/email.js';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function makeToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  const token = makeToken(user.id);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid email or password format' });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid email or password' });

  const token = makeToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Always return success (don't reveal if email exists)
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ success: true });

  // Delete old unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, used: false },
  });

  // Create new token (expires in 1 hour)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token: rawToken, userId: user.id, expiresAt },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  } catch (err) {
    console.error('Email send error:', err.message);
    // Still return success so we don't leak info
  }

  res.json({ success: true });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const schema = z.object({
    token: z.string(),
    password: z.string().min(6).max(100),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset link' });
  if (resetToken.used)  return res.status(400).json({ error: 'This reset link has already been used' });
  if (resetToken.expiresAt < new Date()) return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

  const hashed = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } }),
  ]);

  res.json({ success: true });
});

export default router;
