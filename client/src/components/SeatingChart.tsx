import React from 'react';
import type { Candidate } from '../types';
import { RATING_CATEGORIES } from '../constants';

interface Props {
  candidates: Candidate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function avgRating(c: Candidate): number {
  const vals = RATING_CATEGORIES.map((cat) => c.ratings[cat.id] || 0).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function getFlagCounts(c: Candidate): { yellow: number; red: number } {
  let yellow = 0, red = 0;
  Object.values(c.flags).forEach((f) => {
    if (f === 'yellow') yellow++;
    else if (f === 'red') red++;
  });
  return { yellow, red };
}

function distributeSeats(candidates: Candidate[]): {
  left: Candidate[];
  bottom: Candidate[];
  right: Candidate[];
} {
  const n = candidates.length;
  const leftCount = Math.floor(n / 3);
  const rightCount = Math.floor(n / 3);
  const bottomCount = n - leftCount - rightCount;

  const left = candidates.slice(0, leftCount);
  const bottom = candidates.slice(leftCount, leftCount + bottomCount);
  // Right arm: displayed top-to-bottom, with last seat at top (closest to YOU)
  const right = candidates.slice(leftCount + bottomCount).reverse();

  return { left, bottom, right };
}

interface SeatCardProps {
  candidate: Candidate;
  selected: boolean;
  onClick: () => void;
  position?: string;
}

function SeatCard({ candidate, selected, onClick, position }: SeatCardProps) {
  const avg = avgRating(candidate);
  const { yellow, red } = getFlagCounts(candidate);
  const avgDisplay = avg > 0 ? avg.toFixed(1) : null;

  return (
    <button
      className={`seat-card ${selected ? 'seat-card-selected' : ''} ${position || ''}`}
      onClick={onClick}
      title={`${candidate.name} — Seat ${candidate.seatNumber}`}
    >
      <div className="seat-num">#{candidate.seatNumber}</div>
      <div className="seat-name">{candidate.name || <span className="text-muted">Empty</span>}</div>

      <div className="seat-meta">
        {avgDisplay && (
          <div className="seat-rating">
            <span className="star filled" style={{ fontSize: '0.7rem' }}>★</span>
            <span>{avgDisplay}</span>
          </div>
        )}
        <div className="seat-flags">
          {red > 0 && <span className="flag-dot flag-dot-red" title={`${red} dealbreaker flag${red > 1 ? 's' : ''}`} />}
          {yellow > 0 && <span className="flag-dot flag-dot-yellow" title={`${yellow} caution flag${yellow > 1 ? 's' : ''}`} />}
        </div>
      </div>
    </button>
  );
}

export default function SeatingChart({ candidates, selectedId, onSelect }: Props) {
  const { left, bottom, right } = distributeSeats(candidates);

  return (
    <div className="seating-chart-root">
      {/* YOU label */}
      <div className="you-area">
        <div className="you-label">
          <span className="you-icon">🎤</span>
          YOU
        </div>
        <div className="you-connector" />
      </div>

      {/* U Shape */}
      <div className="u-shape">
        {/* Left Arm */}
        <div className="arm arm-left">
          {left.map((c) => (
            <SeatCard
              key={c.id}
              candidate={c}
              selected={c.id === selectedId}
              onClick={() => onSelect(c.id)}
              position="seat-left"
            />
          ))}
        </div>

        {/* Center (interior of the U) */}
        <div className="u-interior">
          <div className="u-interior-label">Interview Area</div>
        </div>

        {/* Right Arm */}
        <div className="arm arm-right">
          {right.map((c) => (
            <SeatCard
              key={c.id}
              candidate={c}
              selected={c.id === selectedId}
              onClick={() => onSelect(c.id)}
              position="seat-right"
            />
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        {bottom.map((c) => (
          <SeatCard
            key={c.id}
            candidate={c}
            selected={c.id === selectedId}
            onClick={() => onSelect(c.id)}
            position="seat-bottom"
          />
        ))}
      </div>

      <style>{`
        .seating-chart-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          width: 100%;
          padding: 8px 0;
        }

        .you-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 1;
        }

        .you-label {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--accent), var(--accent-bright));
          color: #fff;
          padding: 8px 24px;
          border-radius: 99px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          box-shadow: var(--shadow-accent), 0 0 30px var(--accent-glow-strong);
        }

        .you-icon { font-size: 0.9rem; }

        .you-connector {
          width: 2px;
          height: 20px;
          background: linear-gradient(to bottom, var(--accent), transparent);
        }

        .u-shape {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          width: 100%;
        }

        .arm {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 12px;
          flex: 0 0 auto;
        }

        .arm-left {
          align-items: flex-end;
          padding-right: 12px;
          border-right: 1px solid var(--border-subtle);
        }

        .arm-right {
          align-items: flex-start;
          padding-left: 12px;
          border-left: 1px solid var(--border-subtle);
        }

        .u-interior {
          flex: 1;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .u-interior-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 500;
          opacity: 0.5;
        }

        .bottom-row {
          display: flex;
          flex-direction: row;
          gap: 8px;
          justify-content: center;
          padding: 0 12px;
          flex-wrap: wrap;
          border-top: 1px solid var(--border-subtle);
          padding-top: 8px;
          margin-top: 0;
          width: 100%;
        }

        /* Seat Card */
        .seat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 10px 12px;
          cursor: pointer;
          transition: all var(--transition-med);
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 130px;
          min-height: 90px;
          text-align: left;
          color: var(--text-primary);
          font-family: var(--font-sans);
          position: relative;
          align-items: flex-start;
        }

        .seat-card:hover {
          background: var(--bg-card-hover);
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-accent);
        }

        .seat-card-selected {
          border-color: var(--accent-bright);
          background: var(--bg-elevated);
          box-shadow: 0 0 0 2px var(--accent-glow-strong), var(--shadow-accent);
          transform: translateY(-2px);
        }

        .seat-num {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .seat-card-selected .seat-num {
          color: var(--accent-bright);
        }

        .seat-name {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-primary);
          line-height: 1.2;
          word-break: break-word;
          flex: 1;
        }

        .seat-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-top: 4px;
        }

        .seat-rating {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--star-filled);
        }

        .seat-flags {
          display: flex;
          gap: 4px;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
