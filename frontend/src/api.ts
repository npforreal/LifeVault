const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('lifevault_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { name: string; email: string; password: string }) => request<{ token: string; user: { id: string; name: string; email: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  login: (payload: { email: string; password: string }) => request<{ token: string; user: { id: string; name: string; email: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  listVault: () => request<any[]>('/vault'),
  createVault: (payload: { title: string; description?: string; categoryName?: string; content: string }) => request('/vault', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  destroyVault: (itemId: string) => request(`/vault/${itemId}/destroy`, {
    method: 'POST'
  }),
  listPlans: () => request<any[]>('/plans'),
  listNotifications: () => request<any[]>('/vault/notifications'),
  createPlan: (payload: { name: string; description?: string; schedule: string }) => request('/plans', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  listAccounts: () => request<any[]>('/accounts'),
  createAccount: (payload: { provider: string; scopes?: string }) => request<{ authUrl: string; state: string }>('/accounts/connect', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  exportBackup: (passphrase: string) => request<{ exportString: string }>(`/vault/backup?passphrase=${encodeURIComponent(passphrase)}`),
  restoreBackup: (payload: { exportString: string; passphrase?: string }) => request<{ restored: boolean }>('/vault/restore', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
};
