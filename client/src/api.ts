import type { Session, SessionSummary } from './types';

// All data lives in localStorage — no backend required for static hosting
const STORAGE_KEY = 'cobalt_clean_sessions_v1';

function loadAll(): Record<string, Session> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(sessions: Record<string, Session>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export const getSessions = (): Promise<SessionSummary[]> => {
  const all = loadAll();
  const summaries: SessionSummary[] = Object.values(all)
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      seatCount: s.seatCount,
      email: s.email,
      concluded: s.concluded,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return Promise.resolve(summaries);
};

export const getSession = (id: string): Promise<Session> => {
  const all = loadAll();
  const session = all[id];
  if (!session) return Promise.reject(new Error('Session not found'));
  return Promise.resolve(session);
};

export const createSession = (session: Session): Promise<{ success: boolean }> => {
  const all = loadAll();
  all[session.id] = session;
  saveAll(all);
  return Promise.resolve({ success: true });
};

export const updateSession = (session: Session): Promise<{ success: boolean }> => {
  const all = loadAll();
  all[session.id] = session;
  saveAll(all);
  return Promise.resolve({ success: true });
};

export const deleteSession = (id: string): Promise<{ success: boolean }> => {
  const all = loadAll();
  delete all[id];
  saveAll(all);
  return Promise.resolve({ success: true });
};
