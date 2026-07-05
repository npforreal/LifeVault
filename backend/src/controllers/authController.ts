import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logAudit } from '../services/auditService.js';

const prisma = new PrismaClient();
const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  await logAudit(user.id, 'REGISTER', 'SUCCESS', req.ip);
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET ?? 'dev-secret', { expiresIn: '1h' });
  return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    await logAudit(user.id, 'LOGIN', 'FAILED', req.ip);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await logAudit(user.id, 'LOGIN', 'SUCCESS', req.ip);
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET ?? 'dev-secret', { expiresIn: '1h' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

export { router as authRouter };
