import { Router } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const prisma = new PrismaClient();
const router = Router();

const providerConfigs: Record<string, { authUrl: string; tokenUrl: string }> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token'
  }
};

router.get('/', authenticate, async (req, res) => {
  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });
  await logAudit(req.user!.id, 'ACCOUNT_LIST', 'SUCCESS', req.ip);
  res.json(accounts);
});

router.post('/connect', authenticate, async (req, res) => {
  const { provider, scopes } = req.body;
  const config = providerConfigs[provider?.toLowerCase()];

  if (!config) {
    return res.status(400).json({ error: 'Unsupported provider' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${process.env.APP_BASE_URL ?? 'http://localhost:5173'}/oauth/callback`;
  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set('client_id', process.env[`${provider.toUpperCase()}_CLIENT_ID`] ?? 'demo-client-id');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes ?? 'read:user');
  authUrl.searchParams.set('state', state);

  await prisma.connectedAccount.create({
    data: {
      userId: req.user!.id,
      provider: provider.toLowerCase(),
      providerAccountId: `pending-${state}`,
      accessTokenEncrypted: 'pending',
      scopes: scopes ?? 'read:user',
      status: 'PENDING'
    }
  });

  await logAudit(req.user!.id, 'ACCOUNT_CONNECT_INIT', 'SUCCESS', req.ip);
  res.json({ authUrl: authUrl.toString(), state });
});

router.get('/callback', async (req, res) => {
  const { code, state, provider } = req.query;
  if (!code || !state) {
    return res.status(400).json({ error: 'Missing OAuth callback parameters' });
  }

  const account = await prisma.connectedAccount.findFirst({
    where: { providerAccountId: `pending-${state as string}` }
  });

  if (!account) {
    return res.status(404).json({ error: 'OAuth state not found' });
  }

  await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      providerAccountId: `oauth-${provider ?? account.provider}`,
      accessTokenEncrypted: `token:${code}`,
      status: 'ACTIVE'
    }
  });

  await logAudit(account.userId, 'ACCOUNT_CONNECT_CALLBACK', 'SUCCESS', req.ip);
  res.json({ message: 'Connected account linked successfully' });
});

export { router as accountsRouter };
