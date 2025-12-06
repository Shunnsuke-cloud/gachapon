// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const TOKEN_EXPIRES = '1h';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: { error: 'Too many login attempts, try later' }
});

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('displayName').optional().isLength({ max: 100 })
], async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password, displayName } = req.body;
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const [r] = await conn.execute('INSERT INTO users (email, password_hash, display_name, role) VALUES (?,?,?,?)', [email, hash, displayName || null, 'user']);
    const userId = r.insertId;
    res.status(201).json({ id: userId, email, role: 'user' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  } finally {
    conn.release();
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isString()
], async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT id, password_hash, role, failed_login_attempts, locked_until FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const u = rows[0];

    if (u.locked_until && new Date(u.locked_until) > new Date()) return res.status(423).json({ error: 'Account locked. Try later.' });

    const match = await bcrypt.compare(password, u.password_hash);
    if (!match) {
      const failed = (u.failed_login_attempts || 0) + 1;
      let locked_until = null;
      if (failed >= 6) {
        locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await conn.execute('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?', [failed, locked_until, u.id]);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // reset counters
    await conn.execute('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [u.id]);

    const payload = { sub: u.id, role: u.role, email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
    res.json({ accessToken: token, expiresIn: 3600, user: { id: u.id, email, role: u.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  } finally {
    conn.release();
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'no_token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ id: payload.sub, email: payload.email, role: payload.role });
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
});

module.exports = router;
