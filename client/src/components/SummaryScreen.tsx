import React, { useState } from 'react';
import type { Session, Candidate } from '../types';
import { RATING_CATEGORIES, FLAG_DEFINITIONS } from '../constants';
import { generatePDF } from '../utils/pdf';

interface Props {
  session: Session;
  onBackToEdit: () => void;
  onNewSession: () => void;
}

function avgRating(c: Candidate): number {
  const vals = RATING_CATEGORIES.map((cat) => c.ratings[cat.id] || 0).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="stars stars-sm">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star ${i < Math.round(value) ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  );
}

function CandidateSummaryCard({ candidate }: { candidate: Candidate }) {
  const avg = avgRating(candidate);
  const activeFlags = FLAG_DEFINITIONS.map((f) => ({
    label: f,
    state: candidate.flags[f] || 'off',
  })).filter((f) => f.state !== 'off');

  const notesPreview = candidate.notes.length > 150
    ? candidate.notes.substring(0, 150) + '…'
    : candidate.notes;

  return (
    <div className={`summary-card ${avg >= 4 ? 'summary-card-high' : avg > 0 && avg < 2.5 ? 'summary-card-low' : ''}`}>
      {/* Header */}
      <div className="summary-card-header">
        <div className="summary-seat-badge">Seat {candidate.seatNumber}</div>
        <h3 className="summary-name">{candidate.name}</h3>
        {avg > 0 ? (
          <div className="summary-avg">
            <span className="summary-avg-num">{avg.toFixed(1)}</span>
            <span className="summary-avg-denom">/5</span>
          </div>
        ) : (
          <div className="summary-avg-empty">Not rated</div>
        )}
      </div>

      {/* Star display */}
      {avg > 0 && (
        <div className="summary-stars">
          <StarDisplay value={avg} />
        </div>
      )}

      {/* Category ratings */}
      <div className="summary-categories">
        {RATING_CATEGORIES.map((cat) => {
          const val = candidate.ratings[cat.id] || 0;
          return (
            <div key={cat.id} className="summary-cat-row">
              <span className="summary-cat-label">{cat.label}</span>
              <div className="summary-cat-right">
                <StarDisplay value={val} />
                {val === 0 && <span className="text-muted text-xs">—</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flags */}
      {activeFlags.length > 0 && (
        <div className="summary-flags">
          {activeFlags.map((f) => (
            <span key={f.label} className={`badge badge-${f.state}`}>
              <span className={`flag-dot flag-dot-${f.state}`} />
              {f.label}
            </span>
          ))}
        </div>
      )}

      {/* Notes preview */}
      {notesPreview && (
        <div className="summary-notes">
          <div className="summary-notes-label">Notes</div>
          <p className="summary-notes-text">{notesPreview}</p>
        </div>
      )}
    </div>
  );
}

export default function SummaryScreen({ session, onBackToEdit, onNewSession }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'seat' | 'rating'>('seat');

  const sorted = [...session.candidates].sort((a, b) => {
    if (sortBy === 'rating') return avgRating(b) - avgRating(a);
    return a.seatNumber - b.seatNumber;
  });

  const sessionDate = new Date(session.createdAt);
  const dateStr = sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await generatePDF(session);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEmailReport = () => {
    const subject = encodeURIComponent(`Cobalt Clean — Group Interview Report (${dateStr})`);
    const body = encodeURIComponent(
      `Group Interview Report\n` +
      `Date: ${dateStr} at ${timeStr}\n` +
      `Candidates: ${session.candidates.length}\n\n` +
      sorted.map((c) => {
        const avg = avgRating(c);
        return `Seat ${c.seatNumber}: ${c.name} — ${avg > 0 ? avg.toFixed(1) + '/5' : 'Not rated'}`;
      }).join('\n') +
      `\n\nPlease see attached PDF for full report.`
    );
    const to = session.email ? encodeURIComponent(session.email) : '';
    window.open(`mailto:${to}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="summary-page">
      {/* Header */}
      <header className="summary-header">
        <div className="brand">
          <div className="brand-icon">🧹</div>
          <div>
            <div className="brand-name">Cobalt Clean</div>
            <div className="brand-sub">Interview Summary</div>
          </div>
        </div>

        <div className="summary-session-info">
          <span className="session-info-chip">📅 {dateStr} · {timeStr}</span>
          <span className="session-info-chip">👥 {session.candidates.length} candidates</span>
          <span className="badge badge-green">✓ Concluded</span>
        </div>

        <div className="summary-actions ml-auto">
          <button className="btn btn-ghost btn-sm" onClick={onBackToEdit}>
            ← Back to Edit
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onNewSession}>
            New Session
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleEmailReport}>
            ✉ Email Report
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generating…' : '⬇ Download PDF'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="summary-content">
        <div className="summary-top-bar">
          <div>
            <h2 className="summary-title">Interview Results</h2>
            <p className="summary-subtitle">Review all candidates below. Use PDF export for your records.</p>
          </div>
          <div className="summary-sort">
            <span className="text-sm text-secondary">Sort by:</span>
            <button
              className={`btn btn-sm ${sortBy === 'seat' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setSortBy('seat')}
            >
              Seat #
            </button>
            <button
              className={`btn btn-sm ${sortBy === 'rating' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setSortBy('rating')}
            >
              Rating ↓
            </button>
          </div>
        </div>

        <div className="summary-grid">
          {sorted.map((c) => (
            <CandidateSummaryCard key={c.id} candidate={c} />
          ))}
        </div>
      </div>

      <style>{`
        .summary-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-app);
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 28px;
          height: 60px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 100;
          flex-wrap: wrap;
          min-height: 60px;
        }

        .summary-session-info {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .summary-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .summary-content {
          flex: 1;
          padding: 32px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }

        .summary-top-bar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .summary-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .summary-subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: 4px;
        }

        .summary-sort {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        /* Summary Card */
        .summary-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: border-color var(--transition);
        }

        .summary-card:hover {
          border-color: var(--border);
        }

        .summary-card-high {
          border-color: rgba(23, 196, 122, 0.3);
          background: linear-gradient(to bottom, rgba(23, 196, 122, 0.05), var(--bg-card));
        }

        .summary-card-low {
          border-color: rgba(232, 57, 74, 0.2);
        }

        .summary-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .summary-seat-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 99px;
          padding: 3px 10px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          white-space: nowrap;
        }

        .summary-name {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          flex: 1;
        }

        .summary-avg {
          display: flex;
          align-items: baseline;
          gap: 1px;
          margin-left: auto;
        }

        .summary-avg-num {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--star-filled);
          line-height: 1;
        }

        .summary-avg-denom {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .summary-avg-empty {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-left: auto;
        }

        .summary-stars {
          display: flex;
          align-items: center;
        }

        .summary-categories {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-cat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 4px 0;
          border-bottom: 1px solid var(--border-subtle);
        }

        .summary-cat-row:last-child {
          border-bottom: none;
        }

        .summary-cat-label {
          font-size: 0.78rem;
          color: var(--text-secondary);
          flex: 1;
        }

        .summary-cat-right {
          display: flex;
          align-items: center;
        }

        .summary-flags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .summary-notes {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 12px;
        }

        .summary-notes-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .summary-notes-text {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
