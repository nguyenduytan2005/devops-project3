const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Defaults match .env.example / docker-compose.yml; override with DB_* env vars.
const pool = new Pool({
  user:     process.env.DB_USER     || 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'bugdb',
  password: process.env.DB_PASSWORD || 'bugpassword',
  port:     parseInt(process.env.DB_PORT) || 5432,
});

// ── Health ──────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// ── GET /api/bugs ────────────────────────────────────────────────────────────
// Returns all bugs, newest first.
// OPTIONAL CHALLENGE: support ?search=<query> to filter by title.
//   Example: GET /api/bugs?search=docker  → bugs whose title contains "docker" (case-insensitive)
//   Hint: Use a SQL WHERE clause with ILIKE.
// OPTIONAL CHALLENGE: support ?status=open to filter by status.
app.get('/api/bugs', async (req, res) => {
  try {
    // STUDENT TODO (optional): read req.query.search / req.query.status
    // and add WHERE clauses when they are provided
    const result = await pool.query('SELECT * FROM bugs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/bugs ───────────────────────────────────────────────────────────
// Rejects missing, empty or whitespace-only titles with 400.
app.post('/api/bugs', async (req, res) => {
  try {
    const { title, status = 'open' } = req.body;

    if (typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO bugs (title, status) VALUES ($1, $2) RETURNING *',
      [title, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/bugs/:id ─────────────────────────────────────────────────────
// Returns 200 with the deleted row, or 404 if no bug has that id.
app.delete('/api/bugs/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM bugs WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/bugs/:id ────────────────────────────────────────────────────────
// Accepts { title, status }; returns 200 with the updated row, 400 on invalid
// input, or 404 if no bug has that id.
const VALID_STATUSES = ['open', 'in_progress', 'closed'];

app.put('/api/bugs/:id', async (req, res) => {
  try {
    const { title, status } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE bugs SET title = $1, status = $2 WHERE id = $3 RETURNING *',
      [title, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OPTIONAL CHALLENGE: also accept a { severity } field in the body
//   and store it in the database.  severity must be one of:
//   'low', 'medium', 'high', 'critical'

// ── Server startup ───────────────────────────────────────────────────────────
// Only listen when run directly (node server.js), not when require()-d by tests.
if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Bug Tracker backend running on port ${port}`);
  });
}

// Export the app so tests (supertest) can import it.
module.exports = app;
