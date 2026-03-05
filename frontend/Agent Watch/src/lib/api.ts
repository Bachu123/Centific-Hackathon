const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get the stored JWT access token.
 */
export function getToken(): string | null {
  return localStorage.getItem('observatory_token');
}

/**
 * Store tokens after login/register.
 */
export function setTokens(token: string, refreshToken: string): void {
  localStorage.setItem('observatory_token', token);
  localStorage.setItem('observatory_refresh_token', refreshToken);
}

/**
 * Clear tokens on logout.
 */
export function clearTokens(): void {
  localStorage.removeItem('observatory_token');
  localStorage.removeItem('observatory_refresh_token');
  localStorage.removeItem('observatory_user');
}

/**
 * Core fetch wrapper that attaches JWT and handles 401.
 */
async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Try to refresh the token
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${getToken()}`;
      const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (retryRes.ok) {
        return retryRes.json();
      }
    }
    // Refresh failed — clear tokens and redirect to login
    clearTokens();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Attempt to refresh the access token using the refresh token.
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('observatory_refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.token, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ── Auth API ────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Login failed');
  }
  const data = await res.json();
  setTokens(data.token, data.refreshToken);
  localStorage.setItem('observatory_user', JSON.stringify(data.user));
  return data;
}

export async function apiRegister(email: string, password: string, name: string) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Registration failed');
  }
  const data = await res.json();
  setTokens(data.token, data.refreshToken);
  localStorage.setItem('observatory_user', JSON.stringify(data.user));
  return data;
}

// ── Data API ────────────────────────────────────────────────────────────────

// Agents
export const fetchAgents = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<{ data: any[] }>(`/api/agents${qs}`);
};

export const fetchAgent = (id: string) =>
  apiFetch<{ data: any }>(`/api/agents/${id}`);

export const createAgent = (body: any) =>
  apiFetch<{ data: any }>('/api/agents', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateAgent = (id: string, body: any) =>
  apiFetch<{ data: any }>(`/api/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

export const deleteAgent = (id: string) =>
  apiFetch<{ message: string }>(`/api/agents/${id}`, { method: 'DELETE' });

// Posts
export const fetchPosts = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<{ data: any[] }>(`/api/posts${qs}`);
};

export const fetchPost = (id: string) =>
  apiFetch<{ data: any }>(`/api/posts/${id}`);

export const fetchReplies = (postId: string) =>
  apiFetch<{ data: any[] }>(`/api/posts/${postId}/replies`);

export const createPost = (body: any) =>
  apiFetch<{ data: any }>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const voteOnPost = (postId: string, body: { voter_agent_id: string; vote_type: 'up' | 'down' }) =>
  apiFetch(`/api/posts/${postId}/vote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

// News
export const fetchNews = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<{ data: any[] }>(`/api/news${qs}`);
};

export const fetchNewsItem = (id: string) =>
  apiFetch<{ data: any }>(`/api/news/${id}`);

// Sources
export const fetchSources = () =>
  apiFetch<{ data: any[] }>('/api/sources');

// Reports
export const fetchReports = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<{ data: any[] }>(`/api/reports${qs}`);
};


