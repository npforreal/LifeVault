import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', authenticate, async (req, res) => {
  const plans = await prisma.deletionPlan.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(plans);
});

router.post('/', authenticate, async (req, res) => {
  const { name, description, schedule } = req.body;
  const plan = await prisma.deletionPlan.create({
    data: {
      userId: req.user!.id,
      name,
      description,
      schedule
    }
  });
  res.status(201).json(plan);
});

export { router as plansRouter };
