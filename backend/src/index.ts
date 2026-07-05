import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { authRouter } from './controllers/authController.js';
import { vaultRouter } from './controllers/vaultController.js';
import { plansRouter } from './controllers/plansController.js';
import { accountsRouter } from './controllers/accountsController.js';
import { healthRouter } from './controllers/healthController.js';
import { scheduler } from './scheduler/scheduler.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/plans', plansRouter);
app.use('/api/accounts', accountsRouter);

app.listen(port, () => {
  console.log(`LifeVault backend running on http://localhost:${port}`);
  scheduler.start();
});
