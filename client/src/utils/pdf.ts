import jsPDF from 'jspdf';
import type { Session, Candidate } from '../types';
import { RATING_CATEGORIES, INTERVIEW_QUESTIONS, FLAG_DEFINITIONS } from '../constants';

// ---- Colors ----
const C = {
  bg: [10, 13, 23] as [number, number, number],
  surface: [17, 22, 37] as [number, number, number],
  card: [20, 29, 48] as [number, number, number],
  accent: [45, 110, 245] as [number, number, number],
  accentLight: [79, 142, 255] as [number, number, number],
  text: [232, 237, 248] as [number, number, number],
  textSecondary: [123, 146, 184] as [number, number, number],
  textMuted: [64, 77, 101] as [number, number, number],
  star: [245, 166, 35] as [number, number, number],
  yellow: [245, 166, 35] as [number, number, number],
  yellowBg: [40, 32, 12] as [number, number, number],
  red: [232, 57, 74] as [number, number, number],
  redBg: [40, 12, 15] as [number, number, number],
  green: [23, 196, 122] as [number, number, number],
  border: [38, 58, 92] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function avgRating(c: Candidate): number {
  const vals = RATING_CATEGORIES.map((cat) => c.ratings[cat.id] || 0).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

type Doc = jsPDF;

function rgb(c: [number, number, number]): [number, number, number] {
  return c;
}

function fillRect(doc: Doc, x: number, y: number, w: number, h: number, color: [number, number, number]) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
}

function drawText(
  doc: Doc,
  text: string,
  x: number,
  y: number,
  color: [number, number, number],
  size: number,
  style: 'normal' | 'bold' = 'normal',
  align: 'left' | 'center' | 'right' = 'left'
) {
  doc.setTextColor(...color);
  doc.setFontSize(size);
  doc.setFont('helvetica', style);
  doc.text(text, x, y, { align });
}

function drawStars(doc: Doc, x: number, y: number, value: number, size = 5) {
  const starCount = 5;
  const spacing = size * 1.4;
  for (let i = 0; i < starCount; i++) {
    const filled = i < Math.round(value);
    doc.setTextColor(...(filled ? C.star : C.border));
    doc.setFontSize(size);
    doc.text('★', x + i * spacing, y);
  }
}

function drawLine(doc: Doc, x1: number, y1: number, x2: number, y2: number, color: [number, number, number], thickness = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(thickness);
  doc.line(x1, y1, x2, y2);
}

function wrapText(doc: Doc, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function drawPageBackground(doc: Doc) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, C.bg);
}

function drawHeader(doc: Doc, pageNum: number, totalPages: number) {
  // Header bar
  fillRect(doc, 0, 0, PAGE_W, 16, C.surface);
  drawLine(doc, 0, 16, PAGE_W, 16, C.border);

  // Logo / Brand
  doc.setFillColor(...C.accent);
  doc.roundedRect(MARGIN, 4, 8, 8, 1, 1, 'F');
  drawText(doc, '🧹', MARGIN + 0.5, 10.5, C.white, 5.5);
  drawText(doc, 'COBALT CLEAN', MARGIN + 11, 9, C.text, 7, 'bold');
  drawText(doc, 'Group Interview Report', MARGIN + 11, 14, C.textMuted, 5.5);

  // Page number
  drawText(doc, `${pageNum} / ${totalPages}`, PAGE_W - MARGIN, 10, C.textMuted, 6, 'normal', 'right');
}

function drawCoverPage(doc: Doc, session: Session) {
  drawPageBackground(doc);

  const sessionDate = new Date(session.createdAt);
  const dateStr = sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Hero block
  const heroY = 60;
  fillRect(doc, MARGIN, heroY, CONTENT_W, 70, C.surface);
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.8);
  doc.rect(MARGIN, heroY, CONTENT_W, 70);

  // Accent bar on left of hero
  fillRect(doc, MARGIN, heroY, 3, 70, C.accent);

  drawText(doc, 'COBALT CLEAN', MARGIN + 12, heroY + 18, C.accentLight, 11, 'bold');
  drawText(doc, 'GROUP INTERVIEW REPORT', MARGIN + 12, heroY + 28, C.text, 16, 'bold');

  drawLine(doc, MARGIN + 12, heroY + 33, MARGIN + CONTENT_W - 12, heroY + 33, C.border);

  drawText(doc, dateStr, MARGIN + 12, heroY + 44, C.textSecondary, 9);
  drawText(doc, timeStr, MARGIN + 12, heroY + 54, C.textMuted, 8);
  drawText(doc, `${session.candidates.length} Candidates`, PAGE_W - MARGIN - 4, heroY + 44, C.textSecondary, 9, 'normal', 'right');

  // Candidates overview table
  let tableY = heroY + 85;
  drawText(doc, 'CANDIDATES', MARGIN, tableY, C.accentLight, 7.5, 'bold');
  tableY += 6;

  drawLine(doc, MARGIN, tableY, PAGE_W - MARGIN, tableY, C.border, 0.4);
  tableY += 5;

  // Table headers
  const cols = { seat: MARGIN, name: MARGIN + 22, avg: PAGE_W - MARGIN - 60, flags: PAGE_W - MARGIN - 20 };
  drawText(doc, 'Seat', cols.seat, tableY, C.textMuted, 6.5, 'bold');
  drawText(doc, 'Candidate', cols.name, tableY, C.textMuted, 6.5, 'bold');
  drawText(doc, 'Avg', cols.avg, tableY, C.textMuted, 6.5, 'bold');
  drawText(doc, 'Flags', cols.flags, tableY, C.textMuted, 6.5, 'bold');
  tableY += 4;
  drawLine(doc, MARGIN, tableY, PAGE_W - MARGIN, tableY, C.border, 0.3);
  tableY += 5;

  for (const c of session.candidates) {
    const avg = avgRating(c);
    const yellow = Object.values(c.flags).filter((f) => f === 'yellow').length;
    const red = Object.values(c.flags).filter((f) => f === 'red').length;

    if (tableY > PAGE_H - 30) break;

    // Row bg on alternate
    if (c.seatNumber % 2 === 0) {
      fillRect(doc, MARGIN, tableY - 3.5, CONTENT_W, 8, C.surface);
    }

    drawText(doc, `#${c.seatNumber}`, cols.seat, tableY, C.textSecondary, 7);
    drawText(doc, c.name, cols.name, tableY, C.text, 7, 'bold');

    if (avg > 0) {
      drawStars(doc, cols.avg, tableY, avg, 4.5);
      drawText(doc, avg.toFixed(1), cols.avg + 38, tableY, C.star, 7, 'bold');
    } else {
      drawText(doc, '—', cols.avg, tableY, C.textMuted, 7);
    }

    let flagX = cols.flags;
    if (red > 0) {
      doc.setFillColor(...C.red);
      doc.circle(flagX + 2, tableY - 1.5, 2, 'F');
      drawText(doc, String(red), flagX + 5.5, tableY, C.red, 6);
      flagX += 12;
    }
    if (yellow > 0) {
      doc.setFillColor(...C.yellow);
      doc.circle(flagX + 2, tableY - 1.5, 2, 'F');
      drawText(doc, String(yellow), flagX + 5.5, tableY, C.yellow, 6);
    }
    if (red === 0 && yellow === 0) {
      drawText(doc, '—', cols.flags, tableY, C.textMuted, 7);
    }

    tableY += 8;
  }

  // Footer note
  drawText(doc, 'Detailed candidate pages follow.', MARGIN, PAGE_H - 20, C.textMuted, 7);
  drawLine(doc, 0, PAGE_H - 14, PAGE_W, PAGE_H - 14, C.border);
  drawText(doc, 'Cobalt Clean — Confidential', PAGE_W / 2, PAGE_H - 8, C.textMuted, 6, 'normal', 'center');
}

function drawCandidatePage(doc: Doc, candidate: Candidate, pageNum: number, totalPages: number) {
  drawPageBackground(doc);
  drawHeader(doc, pageNum, totalPages);

  const avg = avgRating(candidate);
  let y = 24;

  // Candidate header block
  fillRect(doc, MARGIN, y, CONTENT_W, 30, C.surface);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, CONTENT_W, 30);
  fillRect(doc, MARGIN, y, 3, 30, C.accent);

  drawText(doc, `SEAT ${candidate.seatNumber}`, MARGIN + 8, y + 8, C.accentLight, 6.5, 'bold');
  drawText(doc, candidate.name, MARGIN + 8, y + 17, C.text, 14, 'bold');

  if (avg > 0) {
    drawText(doc, avg.toFixed(1), PAGE_W - MARGIN - 4, y + 14, C.star, 18, 'bold', 'right');
    drawText(doc, '/ 5.0', PAGE_W - MARGIN - 4, y + 22, C.textMuted, 7, 'normal', 'right');
    drawStars(doc, PAGE_W - MARGIN - 38, y + 26, avg, 5);
  } else {
    drawText(doc, 'Not Rated', PAGE_W - MARGIN - 4, y + 17, C.textMuted, 9, 'normal', 'right');
  }

  y += 36;

  // ---- RATINGS SECTION ----
  drawText(doc, 'CATEGORY RATINGS', MARGIN, y, C.accentLight, 7, 'bold');
  y += 5;
  drawLine(doc, MARGIN, y, PAGE_W - MARGIN, y, C.border, 0.4);
  y += 4;

  const ratingColW = CONTENT_W / 2 - 4;
  let col = 0;
  let colStartX = MARGIN;
  let colY = y;
  let rightColY = y;

  for (const cat of RATING_CATEGORIES) {
    const val = candidate.ratings[cat.id] || 0;
    const curX = col === 0 ? MARGIN : MARGIN + ratingColW + 8;
    const curY = col === 0 ? colY : rightColY;

    fillRect(doc, curX, curY, ratingColW, 16, C.card);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.rect(curX, curY, ratingColW, 16);

    drawText(doc, cat.label, curX + 4, curY + 6.5, C.text, 6.5, 'bold');
    if (val > 0) {
      drawStars(doc, curX + 4, curY + 13, val, 4.5);
      drawText(doc, `${val}/5`, curX + ratingColW - 5, curY + 13, C.star, 6.5, 'bold', 'right');
    } else {
      drawText(doc, 'Not rated', curX + 4, curY + 13, C.textMuted, 6);
    }

    if (col === 0) { colY += 18; col = 1; }
    else { rightColY += 18; col = 0; }
  }

  y = Math.max(colY, rightColY) + 4;

  // ---- FLAGS SECTION ----
  const activeFlags = FLAG_DEFINITIONS.map((f) => ({ label: f, state: candidate.flags[f] || 'off' }))
    .filter((f) => f.state !== 'off');

  if (activeFlags.length > 0) {
    drawText(doc, 'FLAGS', MARGIN, y, C.accentLight, 7, 'bold');
    y += 5;
    drawLine(doc, MARGIN, y, PAGE_W - MARGIN, y, C.border, 0.4);
    y += 4;

    for (const flag of activeFlags) {
      const isRed = flag.state === 'red';
      const bgColor = isRed ? C.redBg : C.yellowBg;
      const dotColor = isRed ? C.red : C.yellow;

      fillRect(doc, MARGIN, y, CONTENT_W, 8, bgColor);
      doc.setFillColor(...dotColor);
      doc.circle(MARGIN + 4, y + 4, 2, 'F');
      drawText(doc, flag.label, MARGIN + 9, y + 5.5, isRed ? C.red : C.yellow, 6.5);
      drawText(doc, isRed ? 'DEALBREAKER' : 'CAUTION', PAGE_W - MARGIN - 2, y + 5.5, dotColor, 5.5, 'bold', 'right');

      y += 9;
      if (y > PAGE_H - 30) break;
    }
    y += 3;
  }

  // ---- NOTES SECTION ----
  if (candidate.notes.trim()) {
    if (y > PAGE_H - 60) {
      doc.addPage();
      drawPageBackground(doc);
      drawHeader(doc, pageNum, totalPages);
      y = 24;
    }

    drawText(doc, 'NOTES', MARGIN, y, C.accentLight, 7, 'bold');
    y += 5;
    drawLine(doc, MARGIN, y, PAGE_W - MARGIN, y, C.border, 0.4);
    y += 4;

    fillRect(doc, MARGIN, y, CONTENT_W, 6, C.surface);
    const noteLines = wrapText(doc, candidate.notes, CONTENT_W - 8, 7);
    fillRect(doc, MARGIN, y, CONTENT_W, noteLines.length * 5 + 8, C.surface);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, CONTENT_W, noteLines.length * 5 + 8);

    doc.setTextColor(...C.textSecondary);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    let noteY = y + 6;
    for (const line of noteLines) {
      if (noteY > PAGE_H - 20) {
        doc.addPage();
        drawPageBackground(doc);
        drawHeader(doc, pageNum, totalPages);
        noteY = 28;
      }
      doc.text(line, MARGIN + 4, noteY);
      noteY += 5;
    }
    y = noteY + 6;
  }

  // ---- Q&A SECTION ----
  const answeredQs = INTERVIEW_QUESTIONS.filter((q) => candidate.answers[q.id]?.trim());

  if (answeredQs.length > 0) {
    if (y > PAGE_H - 50) {
      doc.addPage();
      drawPageBackground(doc);
      drawHeader(doc, pageNum, totalPages);
      y = 24;
    }

    drawText(doc, 'INTERVIEW Q&A', MARGIN, y, C.accentLight, 7, 'bold');
    y += 5;
    drawLine(doc, MARGIN, y, PAGE_W - MARGIN, y, C.border, 0.4);
    y += 5;

    for (const q of INTERVIEW_QUESTIONS) {
      const answer = candidate.answers[q.id]?.trim() || '';

      if (y > PAGE_H - 40) {
        doc.addPage();
        drawPageBackground(doc);
        drawHeader(doc, pageNum, totalPages);
        y = 24;
      }

      // Question
      fillRect(doc, MARGIN, y, CONTENT_W, 8, C.card);
      const qLabel = `${q.id}  `;
      drawText(doc, qLabel, MARGIN + 4, y + 5.5, C.accent, 6.5, 'bold');
      const qLines = wrapText(doc, q.text, CONTENT_W - 20, 6.5);
      if (qLines.length === 1) {
        drawText(doc, qLines[0], MARGIN + 14, y + 5.5, C.text, 6.5);
        y += 10;
      } else {
        fillRect(doc, MARGIN, y, CONTENT_W, qLines.length * 5 + 6, C.card);
        doc.setTextColor(...C.text);
        doc.setFontSize(6.5);
        let qLineY = y + 5.5;
        for (const line of qLines) {
          doc.text(line, MARGIN + 14, qLineY);
          qLineY += 5;
        }
        y += qLines.length * 5 + 6;
      }

      // Answer
      const answerText = answer || 'No response recorded.';
      const aLines = wrapText(doc, answerText, CONTENT_W - 8, 6.5);
      const aHeight = aLines.length * 5 + 8;

      if (y + aHeight > PAGE_H - 20) {
        doc.addPage();
        drawPageBackground(doc);
        drawHeader(doc, pageNum, totalPages);
        y = 24;
      }

      fillRect(doc, MARGIN, y, CONTENT_W, aHeight, C.surface);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN, y, CONTENT_W, aHeight);
      // Left accent bar for answer
      fillRect(doc, MARGIN, y, 2, aHeight, answer ? C.accent : C.textMuted);

      const aColor = answer ? C.textSecondary : C.textMuted;
      doc.setTextColor(...aColor);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      let aY = y + 5;
      for (const line of aLines) {
        doc.text(line, MARGIN + 5, aY);
        aY += 5;
      }

      y += aHeight + 4;
    }
  }

  // Footer
  drawLine(doc, 0, PAGE_H - 14, PAGE_W, PAGE_H - 14, C.border);
  drawText(doc, 'Cobalt Clean — Confidential', PAGE_W / 2, PAGE_H - 8, C.textMuted, 6, 'normal', 'center');
}

export async function generatePDF(session: Session): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalPages = 1 + session.candidates.length;

  // Cover page
  drawCoverPage(doc, session);

  // Candidate pages
  for (let i = 0; i < session.candidates.length; i++) {
    doc.addPage();
    drawCandidatePage(doc, session.candidates[i], i + 2, totalPages);
  }

  const dateStr = new Date(session.createdAt).toISOString().split('T')[0];
  doc.save(`cobalt-clean-interview-${dateStr}.pdf`);
}
