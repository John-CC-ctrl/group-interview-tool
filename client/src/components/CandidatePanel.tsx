import React, { useState } from 'react';
import type { Candidate, FlagState } from '../types';
import { INTERVIEW_QUESTIONS, FLAG_DEFINITIONS, RATING_CATEGORIES } from '../constants';

interface Props {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => void;
  onClose: () => void;
}

type Tab = 'notes' | 'qa' | 'flags' | 'ratings';

// --- Star Rating Component ---
function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className={`stars stars-${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= display ? 'filled' : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          title={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// --- Flag Toggle ---
const FLAG_CYCLE: FlagState[] = ['off', 'yellow', 'red'];
const FLAG_LABELS: Record<FlagState, string> = { off: 'Off', yellow: 'Caution', red: 'Dealbreaker' };

function FlagToggle({
  label,
  state,
  onToggle,
}: {
  label: string;
  state: FlagState;
  onToggle: () => void;
}) {
  return (
    <button className={`flag-toggle flag-toggle-${state}`} onClick={onToggle}>
      <span className={`flag-dot flag-dot-${state}`} />
      <span className="flag-toggle-label">{label}</span>
      <span className={`flag-toggle-state badge ${state === 'yellow' ? 'badge-yellow' : state === 'red' ? 'badge-red' : 'badge-muted'}`}>
        {FLAG_LABELS[state]}
      </span>
    </button>
  );
}

// --- Average Rating ---
function avgRating(c: Candidate): number {
  const vals = RATING_CATEGORIES.map((cat) => c.ratings[cat.id] || 0).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function CandidatePanel({ candidate, onUpdate, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('notes');
  const avg = avgRating(candidate);

  const setRating = (catId: string, val: number) => {
    onUpdate({ ratings: { ...candidate.ratings, [catId]: val } });
  };

  const setFlag = (flagLabel: string) => {
    const current = candidate.flags[flagLabel] || 'off';
    const next = FLAG_CYCLE[(FLAG_CYCLE.indexOf(current) + 1) % FLAG_CYCLE.length];
    onUpdate({ flags: { ...candidate.flags, [flagLabel]: next } });
  };

  const setAnswer = (qId: string, val: string) => {
    onUpdate({ answers: { ...candidate.answers, [qId]: val } });
  };

  const activeFlags = Object.entries(candidate.flags).filter(([, v]) => v !== 'off');

  return (
    <div className="candidate-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-seat-badge">Seat {candidate.seatNumber}</div>
          <div>
            <div className="panel-name">{candidate.name}</div>
            {avg > 0 && (
              <div className="panel-avg">
                <StarRating value={Math.round(avg)} onChange={() => {}} size="sm" />
                <span className="panel-avg-num">{avg.toFixed(1)} avg</span>
              </div>
            )}
          </div>
        </div>
        <div className="panel-header-right">
          {activeFlags.length > 0 && (
            <div className="panel-flag-summary">
              {activeFlags.filter(([, v]) => v === 'red').length > 0 && (
                <span className="badge badge-red">
                  <span className="flag-dot flag-dot-red" />
                  {activeFlags.filter(([, v]) => v === 'red').length} deal
                </span>
              )}
              {activeFlags.filter(([, v]) => v === 'yellow').length > 0 && (
                <span className="badge badge-yellow">
                  <span className="flag-dot flag-dot-yellow" />
                  {activeFlags.filter(([, v]) => v === 'yellow').length} caution
                </span>
              )}
            </div>
          )}
          <button className="panel-close" onClick={onClose} title="Close panel">✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['notes', 'qa', 'flags', 'ratings'] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { notes: 'Notes', qa: 'Q&A', flags: 'Flags', ratings: 'Ratings' };
          const counts: Partial<Record<Tab, number>> = {
            flags: activeFlags.length,
            ratings: RATING_CATEGORIES.filter((c) => candidate.ratings[c.id] > 0).length,
          };
          return (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {labels[t]}
              {counts[t] ? <span className="tab-count">{counts[t]}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="panel-body">

        {/* NOTES TAB */}
        {tab === 'notes' && (
          <div className="tab-content">
            <p className="tab-hint">General observations — body language, engagement, overall impressions.</p>
            <textarea
              className="notes-area"
              placeholder="Type your observations here…"
              value={candidate.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              autoFocus
            />
          </div>
        )}

        {/* Q&A TAB */}
        {tab === 'qa' && (
          <div className="tab-content">
            {INTERVIEW_QUESTIONS.map((q) => (
              <div key={q.id} className="qa-item">
                <div className="qa-question-row">
                  <span className="qa-num">{q.id}</span>
                  <p className="qa-question">{q.text}</p>
                </div>
                <textarea
                  placeholder="Record candidate's response…"
                  value={candidate.answers[q.id] || ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="qa-answer"
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}

        {/* FLAGS TAB */}
        {tab === 'flags' && (
          <div className="tab-content">
            <p className="tab-hint">
              Click to cycle: <span className="badge badge-muted" style={{ marginInline: 4 }}>Off</span>
              → <span className="badge badge-yellow" style={{ marginInline: 4 }}>⚠ Caution</span>
              → <span className="badge badge-red" style={{ marginInline: 4 }}>🚩 Dealbreaker</span>
              → Off
            </p>
            <div className="flags-list">
              {FLAG_DEFINITIONS.map((flag) => (
                <FlagToggle
                  key={flag}
                  label={flag}
                  state={candidate.flags[flag] || 'off'}
                  onToggle={() => setFlag(flag)}
                />
              ))}
            </div>
          </div>
        )}

        {/* RATINGS TAB */}
        {tab === 'ratings' && (
          <div className="tab-content">
            <div className="ratings-grid">
              {RATING_CATEGORIES.map((cat) => {
                const val = candidate.ratings[cat.id] || 0;
                return (
                  <div key={cat.id} className="rating-item">
                    <div className="rating-item-header">
                      <span className="rating-cat-label">{cat.label}</span>
                      {val > 0 && <span className="rating-value">{val}/5</span>}
                    </div>
                    <p className="rating-desc">{cat.description}</p>
                    <div className="rating-stars-row">
                      <StarRating
                        value={val}
                        onChange={(v) => setRating(cat.id, v)}
                        size="lg"
                      />
                      {val === 0 && <span className="text-muted text-xs" style={{ marginLeft: 8 }}>Not rated</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {avg > 0 && (
              <div className="ratings-avg-bar">
                <span className="text-secondary text-sm">Overall Average</span>
                <div className="ratings-avg-display">
                  <StarRating value={Math.round(avg)} onChange={() => {}} size="md" />
                  <span className="ratings-avg-num">{avg.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .candidate-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--border-subtle);
          gap: 12px;
          flex-shrink: 0;
        }

        .panel-header-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .panel-seat-badge {
          background: var(--accent-glow);
          color: var(--accent-bright);
          border: 1px solid rgba(45,110,245,0.3);
          border-radius: var(--radius-sm);
          padding: 4px 10px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
          margin-top: 4px;
        }

        .panel-name {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .panel-avg {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        .panel-avg-num {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .panel-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .panel-flag-summary {
          display: flex;
          gap: 6px;
        }

        .panel-close {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          transition: all var(--transition);
          flex-shrink: 0;
        }

        .panel-close:hover {
          background: var(--red-bg);
          border-color: var(--red);
          color: var(--red);
        }

        .panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .tab-content {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-hint {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .tab-count {
          background: var(--accent-glow);
          color: var(--accent-bright);
          border-radius: 99px;
          padding: 1px 6px;
          font-size: 0.65rem;
          font-weight: 700;
          margin-left: 4px;
        }

        /* Notes */
        .notes-area {
          min-height: 300px;
          resize: vertical;
          line-height: 1.7;
          font-size: 0.9rem;
        }

        /* Q&A */
        .qa-item {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .qa-question-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .qa-num {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-bright);
          background: var(--accent-glow);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          white-space: nowrap;
          margin-top: 1px;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .qa-question {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.5;
        }

        .qa-answer {
          font-size: 0.85rem;
          min-height: 70px;
          resize: vertical;
          line-height: 1.6;
        }

        /* Flags */
        .flags-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .flag-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition);
          font-family: var(--font-sans);
          color: var(--text-primary);
          width: 100%;
        }

        .flag-toggle:hover {
          background: var(--bg-card-hover);
          border-color: var(--border);
        }

        .flag-toggle-yellow {
          background: var(--yellow-bg);
          border-color: rgba(245, 166, 35, 0.3);
        }

        .flag-toggle-red {
          background: var(--red-bg);
          border-color: rgba(232, 57, 74, 0.3);
        }

        .flag-toggle-label {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .flag-toggle-state {
          flex-shrink: 0;
          font-size: 0.7rem;
        }

        /* Ratings */
        .ratings-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rating-item {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 16px;
          transition: border-color var(--transition);
        }

        .rating-item:hover {
          border-color: var(--border);
        }

        .rating-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .rating-cat-label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .rating-value {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--star-filled);
        }

        .rating-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .rating-stars-row {
          display: flex;
          align-items: center;
        }

        .ratings-avg-bar {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 4px;
        }

        .ratings-avg-display {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ratings-avg-num {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--star-filled);
        }
      `}</style>
    </div>
  );
}
