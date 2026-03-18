import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, Screen } from './types';
import type { Candidate, FlagState } from './types';
import { INTERVIEW_QUESTIONS, FLAG_DEFINITIONS, RATING_CATEGORIES } from './constants';
import { createSession, updateSession, getSession, deleteSession } from './api';
import SetupScreen from './components/SetupScreen';
import InterviewView from './components/InterviewView';
import SummaryScreen from './components/SummaryScreen';
import PastSessions from './components/PastSessions';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function makeCandidate(seatNumber: number, name: string): Candidate {
  const flags: Record<string, FlagState> = {};
  FLAG_DEFINITIONS.forEach((f) => { flags[f] = 'off'; });

  const ratings: Record<string, number> = {};
  RATING_CATEGORIES.forEach((c) => { ratings[c.id] = 0; });

  const answers: Record<string, string> = {};
  INTERVIEW_QUESTIONS.forEach((q) => { answers[q.id] = ''; });

  return { id: generateId(), seatNumber, name, notes: '', answers, flags, ratings };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: restore active session from localStorage
  useEffect(() => {
    const activeId = localStorage.getItem('cobalt_active_session');
    if (activeId) {
      getSession(activeId)
        .then((sess) => {
          setSession(sess);
          setScreen(sess.concluded ? 'summary' : 'interview');
        })
        .catch(() => localStorage.removeItem('cobalt_active_session'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const scheduleAutoSave = useCallback((sess: Session) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateSession(sess).catch(console.error);
    }, 1500);
  }, []);

  const startNewSession = async (
    seatCount: number,
    names: string[],
    canvaUrl: string,
    email: string
  ) => {
    const candidates = names.map((name, i) => makeCandidate(i + 1, name));
    const newSession: Session = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      seatCount,
      canvaUrl: canvaUrl || undefined,
      email: email || undefined,
      concluded: false,
      candidates,
    };
    await createSession(newSession);
    localStorage.setItem('cobalt_active_session', newSession.id);
    setSession(newSession);
    setScreen('interview');
  };

  const updateCandidate = useCallback(
    (candidateId: string, updates: Partial<Candidate>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated: Session = {
          ...prev,
          candidates: prev.candidates.map((c) =>
            c.id === candidateId ? { ...c, ...updates } : c
          ),
        };
        scheduleAutoSave(updated);
        return updated;
      });
    },
    [scheduleAutoSave]
  );

  const concludeInterview = async () => {
    if (!session) return;
    const concluded = { ...session, concluded: true };
    setSession(concluded);
    await updateSession(concluded);
    setScreen('summary');
  };

  const loadSession = async (id: string) => {
    const sess = await getSession(id);
    localStorage.setItem('cobalt_active_session', sess.id);
    setSession(sess);
    setScreen(sess.concluded ? 'summary' : 'interview');
  };

  const handleDelete = async (id: string) => {
    await deleteSession(id);
    if (session?.id === id) {
      localStorage.removeItem('cobalt_active_session');
      setSession(null);
      setScreen('setup');
    }
  };

  const goToSetup = () => {
    localStorage.removeItem('cobalt_active_session');
    setSession(null);
    setScreen('setup');
  };

  const goBackToInterview = () => {
    if (!session) return;
    const resumed = { ...session, concluded: false };
    setSession(resumed);
    updateSession(resumed).catch(console.error);
    setScreen('interview');
  };

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</div>
      </div>
    );
  }

  if (screen === 'past') {
    return (
      <PastSessions
        onBack={() => setScreen('setup')}
        onOpen={loadSession}
        onDelete={handleDelete}
      />
    );
  }

  if (screen === 'interview' && session) {
    return (
      <InterviewView
        session={session}
        onUpdateCandidate={updateCandidate}
        onConclude={concludeInterview}
        onNewSession={goToSetup}
      />
    );
  }

  if (screen === 'summary' && session) {
    return (
      <SummaryScreen
        session={session}
        onBackToEdit={goBackToInterview}
        onNewSession={goToSetup}
      />
    );
  }

  return (
    <SetupScreen
      onStart={startNewSession}
      onViewPast={() => setScreen('past')}
    />
  );
}
