import type { Session, SessionSummary } from './types';

const BASE = '/api/sessions';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const getSessions = (): Promise<SessionSummary[]> => request(BASE);

export const getSession = (id: string): Promise<Session> => request(`${BASE}/${id}`);

export const createSession = (session: Session): Promise<{ success: boolean }> =>
  request(BASE, { method: 'POST', body: JSON.stringify(session) });

export const updateSession = (session: Session): Promise<{ success: boolean }> =>
  request(`${BASE}/${session.id}`, { method: 'PUT', body: JSON.stringify(session) });

export const deleteSession = (id: string): Promise<{ success: boolean }> =>
  request(`${BASE}/${id}`, { method: 'DELETE' });
