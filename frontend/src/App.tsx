import { useEffect, useState } from 'react';
import { api } from './api';

type UserSession = {
  id: string;
  name: string;
  email: string;
};

type VaultItem = {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  category?: { name: string };
  preview?: string;
};

function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('General');
  const [content, setContent] = useState('');
  const [planName, setPlanName] = useState('');
  const [planSchedule, setPlanSchedule] = useState('90 days');
  const [plans, setPlans] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [provider, setProvider] = useState('Google');
  const [backupPassphrase, setBackupPassphrase] = useState('lifevault-default');
  const [backupText, setBackupText] = useState('');
  const [restoreText, setRestoreText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('lifevault_user');
    const token = localStorage.getItem('lifevault_token');
    if (saved && token) {
      setSession(JSON.parse(saved));
      void loadVault();
      void loadPlans();
      void loadAccounts();
      void loadNotifications();
    }
  }, []);

  async function loadVault() {
    try {
      const data = await api.listVault();
      setItems(data as VaultItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load vault');
    }
  }

  async function loadPlans() {
    try {
      const data = await api.listPlans();
      setPlans(data as any[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load plans');
    }
  }

  async function loadAccounts() {
    try {
      const data = await api.listAccounts();
      setAccounts(data as any[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load accounts');
    }
  }

  async function loadNotifications() {
    try {
      const data = await api.listNotifications();
      setNotifications(data as any[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = mode === 'register'
        ? await api.register({ name, email, password })
        : await api.login({ email, password });
      localStorage.setItem('lifevault_token', result.token);
      localStorage.setItem('lifevault_user', JSON.stringify(result.user));
      setSession(result.user);
      await loadVault();
      await loadPlans();
      await loadAccounts();
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  async function onCreateVault(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createVault({ title, description, categoryName, content });
      setTitle('');
      setDescription('');
      setCategoryName('General');
      setContent('');
      await loadVault();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create vault item');
    }
  }

  async function onDestroyVault(itemId: string) {
    setError('');
    try {
      await api.destroyVault(itemId);
      await loadVault();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to destroy vault item');
    }
  }

  async function onCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createPlan({ name: planName, description: 'Reusable deletion plan', schedule: planSchedule });
      setPlanName('');
      setPlanSchedule('90 days');
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create plan');
    }
  }

  async function onConnectAccount(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await api.createAccount({ provider, scopes: 'read:profile' });
      window.open(result.authUrl, '_blank', 'noopener,noreferrer');
      setProvider('Google');
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect account');
    }
  }

  async function onExportBackup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await api.exportBackup(backupPassphrase);
      setBackupText(result.exportString);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export backup');
    }
  }

  async function onRestoreBackup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.restoreBackup({ exportString: restoreText, passphrase: backupPassphrase });
      setRestoreText('');
      await loadVault();
      await loadPlans();
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to restore backup');
    }
  }

  function logout() {
    localStorage.removeItem('lifevault_token');
    localStorage.removeItem('lifevault_user');
    setSession(null);
    setItems([]);
    setPlans([]);
    setAccounts([]);
    setNotifications([]);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">LifeVault</p>
            <h1 className="text-2xl font-semibold">Secure Digital Lifecycle Manager</h1>
          </div>
          {session ? (
            <button onClick={logout} className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
              Logout
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">{session ? `Welcome back, ${session.name}` : 'Access your vault'}</h2>
            {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
            {!session ? (
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMode('login')} className={`rounded-full px-3 py-2 text-sm ${mode === 'login' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>Login</button>
                  <button type="button" onClick={() => setMode('register')} className={`rounded-full px-3 py-2 text-sm ${mode === 'register' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>Register</button>
                </div>
                {mode === 'register' ? <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" /> : null}
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <button className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">{mode === 'register' ? 'Create account' : 'Sign in'}</button>
              </form>
            ) : (
              <form onSubmit={onCreateVault} className="mt-4 space-y-3">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Sensitive content" className="min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <button className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950">Encrypt and store</button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Vault Items</h2>
              <span className="text-sm text-slate-400">Encrypted by design</span>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.category?.name ?? 'General'}</p>
                      <p className="mt-2 text-sm text-slate-300">{item.preview ?? 'No preview available'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300">{item.status}</p>
                      <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {item.status !== 'DESTROYED' ? (
                    <button onClick={() => void onDestroyVault(item.id)} className="mt-3 rounded-lg border border-rose-500/40 px-3 py-1.5 text-sm text-rose-300">Destroy</button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Deletion Plans</h2>
            {session ? (
              <form onSubmit={onCreatePlan} className="mt-4 space-y-3">
                <input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Plan name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <input value={planSchedule} onChange={(e) => setPlanSchedule(e.target.value)} placeholder="Schedule" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <button className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save plan</button>
              </form>
            ) : null}
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {plans.length > 0 ? plans.map((plan) => (
                <li key={plan.id} className="rounded-xl bg-slate-950/70 p-3">{plan.name} • {plan.schedule}</li>
              )) : <li className="rounded-xl bg-slate-950/70 p-3">No plans yet</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Connected Accounts</h2>
            {session ? (
              <form onSubmit={onConnectAccount} className="mt-4 space-y-3">
                <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                <button className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Connect account</button>
              </form>
            ) : null}
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {accounts.length > 0 ? accounts.map((account) => (
                <li key={account.id} className="rounded-xl bg-slate-950/70 p-3">{account.provider} • {account.status}</li>
              )) : <li className="rounded-xl bg-slate-950/70 p-3">No connected accounts</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Backup & Restore</h2>
            <form onSubmit={onExportBackup} className="mt-4 space-y-3">
              <input value={backupPassphrase} onChange={(e) => setBackupPassphrase(e.target.value)} placeholder="Passphrase" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              <button className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-slate-950">Export encrypted backup</button>
            </form>
            {backupText ? <textarea value={backupText} readOnly className="mt-3 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" /> : null}
            <form onSubmit={onRestoreBackup} className="mt-4 space-y-3">
              <textarea value={restoreText} onChange={(e) => setRestoreText(e.target.value)} placeholder="Paste backup bundle" className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              <button className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950">Restore backup</button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {notifications.length > 0 ? notifications.map((notification) => (
                <li key={notification.id} className="rounded-xl bg-slate-950/70 p-3">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-slate-400">{notification.body}</div>
                </li>
              )) : <li className="rounded-xl bg-slate-950/70 p-3">No notifications yet</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Scheduled Jobs</h2>
            <p className="mt-3 text-sm text-slate-400">Auto-expiration, cryptographic erasure, and account lifecycle actions are queued and audited.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
