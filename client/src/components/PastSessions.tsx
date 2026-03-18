import React, { useState, useEffect } from 'react';
import type { SessionSummary, Session } from '../types';
import { getSessions, getSession } from '../api';
import CompareView from './CompareView';

interface Props {
  onBack: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PastSessions({ onBack, onOpen, onDelete }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareData, setCompareData] = useState<Session[] | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(() => setError('Failed to load sessions.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCompare = async () => {
    if (selectedIds.size < 2) return;
    setCompareLoading(true);
    try {
      const loaded = await Promise.all([...selectedIds].map((id) => getSession(id)));
      setCompareData(loaded);
    } catch {
      setError('Failed to load sessions for comparison.');
    } finally {
      setCompareLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="past-page">
      {/* Header */}
      <header className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div className="brand" style={{ marginLeft: 8 }}>
          <div className="brand-icon">🧹</div>
          <div>
            <div className="brand-name">Cobalt Clean</div>
            <div className="brand-sub">Past Sessions</div>
          </div>
        </div>

        {selectedIds.size >= 2 && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCompare}
            disabled={compareLoading}
            style={{ marginLeft: 'auto' }}
          >
            {compareLoading ? 'Loading…' : `Compare ${selectedIds.size} Sessions`}
          </button>
        )}
      </header>

      {/* Content */}
      <div className="page-content">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Past Interview Sessions</h2>
          <p className="text-secondary text-sm" style={{ marginTop: 6 }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved.
            {sessions.length >= 2 && ' Check two or more sessions to compare candidates.'}
          </p>
        </div>

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading sessions…</p>
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(232,57,74,0.3)', borderRadius: 'var(--radius-sm)', padding: '16px', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p style={{ color: 'var(--text-secondary)' }}>No past sessions found.</p>
            <button className="btn btn-primary" onClick={onBack} style={{ marginTop: 8 }}>
              Start Your First Session
            </button>
          </div>
        )}

        <div className="sessions-list">
          {sessions.map((s) => {
            const { date, time } = formatDate(s.createdAt);
            const isSelected = selectedIds.has(s.id);
            return (
              <div key={s.id} className={`session-row ${isSelected ? 'session-row-selected' : ''}`}>
                <label className="session-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(s.id)}
                    className="session-checkbox"
                  />
                </label>

                <div className="session-info">
                  <div className="session-date">{date}</div>
                  <div className="session-meta">
                    <span className="text-muted text-xs">{time}</span>
                    <span className="session-dot">·</span>
                    <span className="text-secondary text-xs">{s.seatCount} candidate{s.seatCount !== 1 ? 's' : ''}</span>
                    {s.email && (
                      <>
                        <span className="session-dot">·</span>
                        <span className="text-muted text-xs">{s.email}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="session-status">
                  {s.concluded ? (
                    <span className="badge badge-green">✓ Concluded</span>
                  ) : (
                    <span className="badge badge-blue">In Progress</span>
                  )}
                </div>

                <div className="session-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpen(s.id)}
                  >
                    {s.concluded ? 'View Summary' : 'Continue'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                  >
                    {deletingId === s.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {compareData && (
        <CompareView sessions={compareData} onClose={() => setCompareData(null)} />
      )}

      <style>{`
        .past-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-app);
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .session-row {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 16px 20px;
          transition: all var(--transition);
        }

        .session-row:hover {
          border-color: var(--border);
          background: var(--bg-card-hover);
        }

        .session-row-selected {
          border-color: var(--accent);
          background: var(--bg-elevated);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }

        .session-checkbox-wrap {
          display: flex;
          align-items: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .session-checkbox {
          width: 18px !important;
          height: 18px !important;
          accent-color: var(--accent);
          cursor: pointer;
          border-radius: 4px !important;
          padding: 0 !important;
          min-width: unset !important;
        }

        .session-info {
          flex: 1;
          min-width: 0;
        }

        .session-date {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-bottom: 3px;
        }

        .session-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .session-dot {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .session-status {
          flex-shrink: 0;
        }

        .session-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
