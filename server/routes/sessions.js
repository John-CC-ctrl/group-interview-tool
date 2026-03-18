const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET all sessions (summary only)
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const rows = db
      .prepare(
        'SELECT id, created_at, seat_count, email, concluded FROM sessions ORDER BY created_at DESC'
      )
      .all();

    res.json(
      rows.map((s) => ({
        id: s.id,
        createdAt: s.created_at,
        seatCount: s.seat_count,
        email: s.email,
        concluded: Boolean(s.concluded),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET single session by ID (full data)
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Session not found' });

    const parsed = JSON.parse(row.data);
    res.json({
      id: row.id,
      createdAt: row.created_at,
      seatCount: row.seat_count,
      canvaUrl: row.canva_url || undefined,
      email: row.email || undefined,
      concluded: Boolean(row.concluded),
      ...parsed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST create new session
router.post('/', (req, res) => {
  try {
    const db = getDB();
    const { id, createdAt, seatCount, canvaUrl, email, concluded, ...rest } = req.body;

    db.prepare(
      `INSERT INTO sessions (id, created_at, seat_count, canva_url, email, concluded, data, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      createdAt,
      seatCount,
      canvaUrl || null,
      email || null,
      concluded ? 1 : 0,
      JSON.stringify(rest),
      new Date().toISOString()
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT update session
router.put('/:id', (req, res) => {
  try {
    const db = getDB();
    const { createdAt, seatCount, canvaUrl, email, concluded, ...rest } = req.body;

    db.prepare(
      `UPDATE sessions
       SET seat_count = ?, canva_url = ?, email = ?, concluded = ?, data = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      seatCount,
      canvaUrl || null,
      email || null,
      concluded ? 1 : 0,
      JSON.stringify(rest),
      new Date().toISOString(),
      req.params.id
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE session
router.delete('/:id', (req, res) => {
  try {
    const db = getDB();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
