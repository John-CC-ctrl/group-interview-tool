import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Session, Candidate } from '../types';
import { RATING_CATEGORIES } from '../constants';
import SeatingChart from './SeatingChart';
import CandidatePanel from './CandidatePanel';

interface Props {
  session: Session;
  onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
  onAddCandidate: (name: string) => void;
  onConclude: () => void;
  onNewSession: () => void;
}

function avgRating(c: Candidate): number {
  const vals = RATING_CATEGORIES.map((cat) => c.ratings[cat.id] || 0).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function MiniCard({
  candidate,
  selected,
  onClick,
}: {
  candidate: Candidate;
  selected: boolean;
  onClick: () => void;
}) {
  const avg = avgRating(candidate);
  const yellowFlags = Object.values(candidate.flags).filter((f) => f === 'yellow').length;
  const redFlags = Object.values(candidate.flags).filter((f) => f === 'red').length;

  return (
    <button className={`mini-card ${selected ? 'mini-card-selected' : ''}`} onClick={onClick}>
      <div className="mini-seat">#{candidate.seatNumber}</div>
      <div className="mini-name">{candidate.name}</div>
      <div className="mini-footer">
        {avg > 0 ? (
          <span className="mini-rating">★ {avg.toFixed(1)}</span>
        ) : (
          <span className="mini-rating-empty">Not rated</span>
        )}
        <div className="mini-flags">
          {redFlags > 0 && <span className="flag-dot flag-dot-red" />}
          {yellowFlags > 0 && <span className="flag-dot flag-dot-yellow" />}
        </div>
      </div>
    </button>
  );
}

export default function InterviewView({ session, onUpdateCandidate, onAddCandidate, onConclude, onNewSession }: Props) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);
  const [concludeConfirm, setConcludeConfirm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddForm) addInputRef.current?.focus();
  }, [showAddForm]);

  const handleAddCandidate = () => {
    const name = newName.trim() || `Candidate ${session.candidates.length + 1}`;
    onAddCandidate(name);
    setNewName('');
    setShowAddForm(false);
  };

  const selectedCandidate = session.candidates.find((c) => c.id === selectedCandidateId) || null;
  const hasPresentation = Boolean(session.canvaUrl);

  const handleSelect = useCallback((id: string) => {
    setSelectedCandidateId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCandidateId(null);
  }, []);

  const handleUpdate = useCallback(
    (updates: Partial<Candidate>) => {
      if (selectedCandidateId) onUpdateCandidate(selectedCandidateId, updates);
    },
    [selectedCandidateId, onUpdateCandidate]
  );

  const sessionDate = new Date(session.createdAt);
  const dateStr = sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Build Canva embed URL
  const canvaEmbedUrl = session.canvaUrl?.includes('embed')
    ? session.canvaUrl
    : session.canvaUrl?.replace('/view', '/embed') || session.canvaUrl;

  return (
    <div className="interview-page">
      {/* Top Bar */}
      <header className="interview-header">
        <div className="brand">
          <div className="brand-icon">🧹</div>
          <div>
            <div className="brand-name">Cobalt Clean</div>
            <div className="brand-sub">Group Interview</div>
          </div>
        </div>

        <div className="header-session-info">
          <span className="session-info-chip">
            📅 {dateStr} · {timeStr}
          </span>
          <span className="session-info-chip">
            👥 {session.candidates.length} candidate{session.candidates.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="header-actions">
          {hasPresentation && (
            <button
              className={`btn ${showPresentation ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
              onClick={() => setShowPresentation((v) => !v)}
            >
              {showPresentation ? '🖥 Hide Presentation' : '🖥 Show Presentation'}
            </button>
          )}

          <button
            className="btn btn-warn btn-sm"
            onClick={() => onNewSession()}
            title="Return to setup without concluding"
          >
            ← New Session
          </button>

          {concludeConfirm ? (
            <div className="conclude-confirm">
              <span className="text-sm text-secondary">Conclude interview?</span>
              <button className="btn btn-primary btn-sm" onClick={onConclude}>Yes, Conclude</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConcludeConfirm(false)}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setConcludeConfirm(true)}>
              Conclude Interview →
            </button>
          )}
        </div>
      </header>

      {/* Canva Presentation iframe */}
      {showPresentation && hasPresentation && (
        <div className="presentation-container">
          <div className="presentation-bar">
            <span className="text-sm text-secondary">📊 Presentation</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPresentation(false)}>
              Hide ✕
            </button>
          </div>
          <iframe
            src={canvaEmbedUrl}
            className="presentation-frame"
            allow="fullscreen"
            loading="lazy"
            title="Canva Presentation"
          />
        </div>
      )}

      {/* Main Interview Area */}
      <div className="interview-body">

        {/* Left: Seating Chart + Mini Cards */}
        <div className={`interview-left ${selectedCandidate ? 'panel-open' : ''}`}>
          <div className="section-heading">
            <span className="section-label">Seating Chart</span>
            <span className="text-muted text-xs">Click a seat to open candidate panel</span>
            <button
              className="btn btn-ghost btn-sm add-candidate-btn"
              onClick={() => setShowAddForm((v) => !v)}
              title="Add a new candidate to this session"
            >
              {showAddForm ? '✕ Cancel' : '+ Add Candidate'}
            </button>
          </div>

          {showAddForm && (
            <div className="add-candidate-form">
              <input
                ref={addInputRef}
                type="text"
                placeholder={`Seat ${session.candidates.length + 1} — candidate name`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCandidate();
                  if (e.key === 'Escape') { setShowAddForm(false); setNewName(''); }
                }}
                className="add-candidate-input"
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddCandidate}>
                Add →
              </button>
            </div>
          )}

          <div className="seating-wrapper">
            <SeatingChart
              candidates={session.candidates}
              selectedId={selectedCandidateId}
              onSelect={handleSelect}
            />
          </div>

          <div className="divider" />

          <div className="section-heading">
            <span className="section-label">Quick Overview</span>
          </div>

          <div className="mini-cards-grid">
            {session.candidates.map((c) => (
              <MiniCard
                key={c.id}
                candidate={c}
                selected={c.id === selectedCandidateId}
                onClick={() => handleSelect(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Candidate Panel */}
        {selectedCandidate && (
          <div className="interview-right">
            <CandidatePanel
              key={selectedCandidate.id}
              candidate={selectedCandidate}
              onUpdate={handleUpdate}
              onClose={handleClose}
            />
          </div>
        )}
      </div>

      <style>{`
        .interview-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-app);
        }

        /* ---- Header ---- */
        .interview-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 24px;
          height: 60px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 200;
          flex-shrink: 0;
        }

        .header-session-info {
          display: flex;
          gap: 8px;
          margin-left: 8px;
          flex-wrap: wrap;
        }

        .session-info-chip {
          font-size: 0.78rem;
          color: var(--text-secondary);
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          padding: 4px 10px;
          border-radius: 99px;
          white-space: nowrap;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-wrap: wrap;
        }

        .conclude-confirm {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        /* ---- Presentation ---- */
        .presentation-container {
          flex-shrink: 0;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-surface);
        }

        .presentation-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 24px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .presentation-frame {
          width: 100%;
          height: 520px;
          border: none;
          display: block;
        }

        /* ---- Body Layout ---- */
        .interview-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          min-height: 0;
        }

        .interview-left {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          transition: flex var(--transition-med);
          min-width: 0;
        }

        .interview-left.panel-open {
          flex: 0 0 55%;
        }

        .interview-right {
          flex: 0 0 45%;
          background: var(--bg-surface);
          border-left: 1px solid var(--border-subtle);
          overflow-y: auto;
          animation: slideIn 0.22s ease;
          min-width: 0;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .section-heading {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 16px;
        }

        .section-label {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .seating-wrapper {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
          margin-bottom: 24px;
        }

        /* Mini Cards */
        .mini-cards-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mini-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 10px 14px;
          cursor: pointer;
          transition: all var(--transition);
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 110px;
          text-align: left;
          color: var(--text-primary);
          font-family: var(--font-sans);
        }

        .mini-card:hover {
          background: var(--bg-card-hover);
          border-color: var(--accent);
        }

        .mini-card-selected {
          border-color: var(--accent-bright);
          background: var(--bg-elevated);
          box-shadow: 0 0 0 2px var(--accent-glow-strong);
        }

        .mini-seat {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .mini-card-selected .mini-seat {
          color: var(--accent-bright);
        }

        .mini-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          word-break: break-word;
        }

        .mini-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .mini-rating {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--star-filled);
        }

        .mini-rating-empty {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .mini-flags {
          display: flex;
          gap: 3px;
        }

        /* Add Candidate */
        .add-candidate-btn {
          margin-left: auto;
          font-size: 0.78rem;
          padding: 4px 12px;
          color: var(--accent-bright);
          border-color: rgba(45,110,245,0.3);
        }

        .add-candidate-btn:hover {
          background: var(--accent-glow);
          border-color: var(--accent);
        }

        .add-candidate-form {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--accent);
          border-radius: var(--radius);
          animation: fadeIn 0.15s ease;
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .add-candidate-input {
          flex: 1;
          font-size: 0.875rem;
          padding: 8px 12px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          outline: none;
        }

        .add-candidate-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
      `}</style>
    </div>
  );
}
