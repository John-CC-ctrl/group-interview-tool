import React, { useState } from 'react';

interface Props {
  onStart: (seatCount: number, names: string[], canvaUrl: string, email: string) => Promise<void>;
  onViewPast: () => void;
}

export default function SetupScreen({ onStart, onViewPast }: Props) {
  const [seatCount, setSeatCount] = useState(6);
  const [names, setNames] = useState<string[]>(Array(6).fill(''));
  const [canvaUrl, setCanvaUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSeatCountChange = (n: number) => {
    const clamped = Math.min(12, Math.max(2, n));
    setSeatCount(clamped);
    setNames((prev) => {
      const arr = [...prev];
      while (arr.length < clamped) arr.push('');
      return arr.slice(0, clamped);
    });
  };

  const handleNameChange = (i: number, val: string) => {
    setNames((prev) => {
      const arr = [...prev];
      arr[i] = val;
      return arr;
    });
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const filled = names.slice(0, seatCount).filter((n) => n.trim());
    if (filled.length === 0) errs.push('Enter at least one candidate name.');
    return errs;
  };

  const handleStart = async () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setLoading(true);
    try {
      await onStart(seatCount, names.slice(0, seatCount).map((n) => n.trim() || `Candidate`), canvaUrl.trim(), email.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page">
      {/* Background grid decoration */}
      <div className="setup-bg-grid" />

      <div className="setup-container">
        {/* Header */}
        <div className="setup-header">
          <div className="setup-logo">
            <div className="brand-icon" style={{ width: 48, height: 48, fontSize: '1.5rem' }}>🧹</div>
          </div>
          <h1 className="setup-title">Cobalt Clean</h1>
          <p className="setup-subtitle">Group Interview Candidate Rater</p>
        </div>

        <div className="setup-body">
          {/* Session Config Card */}
          <div className="card setup-card">
            <div className="setup-section-title">
              <span className="setup-section-num">01</span>
              Session Setup
            </div>

            {/* Seat Count */}
            <div className="form-group">
              <label className="label">Number of Candidates</label>
              <div className="seat-count-control">
                <button
                  className="btn btn-secondary btn-sm seat-adj"
                  onClick={() => handleSeatCountChange(seatCount - 1)}
                  disabled={seatCount <= 2}
                >−</button>
                <div className="seat-count-display">{seatCount}</div>
                <button
                  className="btn btn-secondary btn-sm seat-adj"
                  onClick={() => handleSeatCountChange(seatCount + 1)}
                  disabled={seatCount >= 12}
                >+</button>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={seatCount}
                  onChange={(e) => handleSeatCountChange(Number(e.target.value))}
                  className="seat-slider"
                />
                <span className="text-muted text-sm">2 – 12 seats</span>
              </div>
            </div>

            {/* Candidate Names */}
            <div className="form-group">
              <label className="label">Candidate Names</label>
              <div className="name-grid">
                {Array.from({ length: seatCount }, (_, i) => (
                  <div key={i} className="name-input-row">
                    <span className="seat-label">Seat {i + 1}</span>
                    <input
                      type="text"
                      placeholder={`Candidate name`}
                      value={names[i] || ''}
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && i < seatCount - 1) {
                          const next = document.getElementById(`name-${i + 1}`);
                          next?.focus();
                        }
                      }}
                      id={`name-${i}`}
                      autoFocus={i === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Fields Card */}
          <div className="card setup-card">
            <div className="setup-section-title">
              <span className="setup-section-num">02</span>
              Optional Settings
            </div>

            <div className="form-group">
              <label className="label">Canva Presentation URL</label>
              <input
                type="url"
                placeholder="https://www.canva.com/design/..."
                value={canvaUrl}
                onChange={(e) => setCanvaUrl(e.target.value)}
              />
              <p className="field-hint">Paste a Canva embed link to present from within the app during the interview.</p>
            </div>

            <div className="form-group">
              <label className="label">Email Address (for PDF report)</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="field-hint">Used to pre-fill the email client when sending the final report.</p>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="setup-errors">
              {errors.map((e, i) => <div key={i} className="setup-error">⚠ {e}</div>)}
            </div>
          )}

          {/* Actions */}
          <div className="setup-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStart}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Creating Session…' : '▶  Start Interview Session'}
            </button>
            <button className="btn btn-ghost btn-lg" onClick={onViewPast}>
              Past Sessions
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .setup-page {
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .setup-bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(45, 110, 245, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45, 110, 245, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .setup-container {
          width: 100%;
          max-width: 680px;
          position: relative;
          z-index: 1;
        }

        .setup-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .setup-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }

        .setup-title {
          font-size: 2.2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #fff 40%, var(--accent-bright));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 6px;
        }

        .setup-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .setup-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .setup-card {
          animation: fadeUp 0.3s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .setup-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .setup-section-num {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-bright);
          background: var(--accent-glow);
          padding: 3px 8px;
          border-radius: 99px;
          letter-spacing: 0.08em;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .field-hint {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 6px;
          line-height: 1.5;
        }

        .seat-count-control {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .seat-count-display {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--accent-bright);
          min-width: 48px;
          text-align: center;
        }

        .seat-adj {
          width: 36px;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 300;
          border-radius: var(--radius-sm);
        }

        .seat-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 99px;
          background: var(--border);
          outline: none;
          flex: 1;
          min-width: 100px;
          cursor: pointer;
          border: none;
          padding: 0;
          box-shadow: none;
        }

        .seat-slider:focus {
          box-shadow: none;
          border-color: transparent;
        }

        .seat-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .name-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .name-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .seat-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          min-width: 52px;
          text-align: right;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .name-input-row input {
          flex: 1;
        }

        .setup-errors {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .setup-error {
          background: var(--red-bg);
          color: var(--red);
          border: 1px solid rgba(232, 57, 74, 0.3);
          border-radius: var(--radius-sm);
          padding: 10px 16px;
          font-size: 0.875rem;
        }

        .setup-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
