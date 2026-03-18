import React from 'react';
import type { Session, Candidate } from '../types';
import { RATING_CATEGORIES } from '../constants';

interface Props {
  sessions: Session[];
  onClose: () => void;
}

function avgRating(c: Candidate): number {
  const vals = RATING_CATEGORIES.map((cat) => c.ratings[cat.id] || 0).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function StarBars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <div className="compare-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`star ${n <= filled ? 'filled' : ''}`} style={{ fontSize: '0.7rem' }}>★</span>
      ))}
      {value > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 4 }}>{value.toFixed(1)}</span>}
    </div>
  );
}

export default function CompareView({ sessions, onClose }: Props) {
  // Flatten all candidates across selected sessions
  const allCandidates: Array<{ candidate: Candidate; sessionDate: string }> = sessions.flatMap((s) =>
    s.candidates.map((c) => ({
      candidate: c,
      sessionDate: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
  );

  return (
    <div className="compare-overlay">
      <div className="compare-modal">
        <div className="compare-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Candidate Comparison</h2>
            <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
              {allCandidates.length} candidates across {sessions.length} session{sessions.length > 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div className="compare-body">
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="compare-th compare-th-sticky">Category</th>
                  {allCandidates.map(({ candidate, sessionDate }, i) => (
                    <th key={i} className="compare-th">
                      <div className="compare-col-header">
                        <div className="compare-col-date">{sessionDate}</div>
                        <div className="compare-col-name">{candidate.name}</div>
                        <div className="compare-col-seat">Seat {candidate.seatNumber}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Average row */}
                <tr className="compare-avg-row">
                  <td className="compare-td compare-td-sticky compare-row-label">
                    ⭐ Overall Average
                  </td>
                  {allCandidates.map(({ candidate }, i) => {
                    const avg = avgRating(candidate);
                    return (
                      <td key={i} className="compare-td compare-avg-cell">
                        {avg > 0 ? (
                          <>
                            <span className="compare-avg-num">{avg.toFixed(1)}</span>
                            <StarBars value={avg} />
                          </>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Category rows */}
                {RATING_CATEGORIES.map((cat) => (
                  <tr key={cat.id} className="compare-row">
                    <td className="compare-td compare-td-sticky compare-row-label">{cat.label}</td>
                    {allCandidates.map(({ candidate }, i) => {
                      const val = candidate.ratings[cat.id] || 0;
                      return (
                        <td key={i} className="compare-td">
                          {val > 0 ? <StarBars value={val} /> : <span className="text-muted text-xs">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Flags row */}
                <tr className="compare-row">
                  <td className="compare-td compare-td-sticky compare-row-label">🚩 Flags</td>
                  {allCandidates.map(({ candidate }, i) => {
                    const yellow = Object.values(candidate.flags).filter((f) => f === 'yellow').length;
                    const red = Object.values(candidate.flags).filter((f) => f === 'red').length;
                    return (
                      <td key={i} className="compare-td">
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {red > 0 && <span className="badge badge-red"><span className="flag-dot flag-dot-red" />{red}</span>}
                          {yellow > 0 && <span className="badge badge-yellow"><span className="flag-dot flag-dot-yellow" />{yellow}</span>}
                          {red === 0 && yellow === 0 && <span className="text-muted text-xs">None</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .compare-overlay {
          position: fixed;
          inset: 0;
          background: var(--bg-overlay);
          backdrop-filter: blur(4px);
          z-index: 500;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 20px;
          overflow-y: auto;
        }

        .compare-modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 1200px;
          box-shadow: var(--shadow-lg);
          animation: fadeUp 0.25s ease;
          overflow: hidden;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .compare-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .compare-body {
          padding: 24px 28px;
          overflow-x: auto;
        }

        .compare-table-wrap {
          overflow-x: auto;
        }

        .compare-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .compare-th {
          padding: 12px 16px;
          text-align: center;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-secondary);
          background: var(--bg-card);
          border-bottom: 2px solid var(--border);
          white-space: nowrap;
        }

        .compare-th-sticky {
          text-align: left;
          position: sticky;
          left: 0;
          z-index: 1;
        }

        .compare-col-header {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: center;
        }

        .compare-col-date {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .compare-col-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-display);
        }

        .compare-col-seat {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .compare-td {
          padding: 10px 16px;
          text-align: center;
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }

        .compare-td-sticky {
          text-align: left;
          position: sticky;
          left: 0;
          background: var(--bg-surface);
          z-index: 1;
        }

        .compare-row-label {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-secondary);
          white-space: nowrap;
          padding-right: 24px;
        }

        .compare-row:hover .compare-td {
          background: var(--bg-card);
        }

        .compare-row:hover .compare-td-sticky {
          background: var(--bg-card);
        }

        .compare-avg-row .compare-td {
          background: var(--bg-card);
          font-weight: 600;
        }

        .compare-avg-cell {
          display: table-cell;
        }

        .compare-avg-num {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--star-filled);
          display: block;
          line-height: 1.2;
        }

        .compare-stars {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }
      `}</style>
    </div>
  );
}
