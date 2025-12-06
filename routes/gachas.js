// routes/gachas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/gachas
router.get('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
  const [rows] = await conn.execute('SELECT id,title,thumbnail,category,rarity_rates,created_at FROM gachas ORDER BY created_at DESC');
  res.json(rows.map(r => ({ ...r, rarity_rates: (r.rarity_rates && typeof r.rarity_rates === 'string') ? JSON.parse(r.rarity_rates) : (r.rarity_rates || null) })));
  } catch (err) {
    console.error(err);
    try{ fs.appendFileSync('server-error.log', `[${new Date().toISOString()}] GET /api/gachas error:\n${err.stack || err}\n\n`); }catch(e){}
    res.status(500).json({ error: 'server_error' });
  } finally { conn.release(); }
});

// GET /api/gachas/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    const [grows] = await conn.execute('SELECT * FROM gachas WHERE id = ?', [id]);
    if (!grows.length) return res.status(404).json({ error: 'not_found' });
    const gacha = grows[0];
  gacha.rarity_rates = (gacha.rarity_rates && typeof gacha.rarity_rates === 'string') ? JSON.parse(gacha.rarity_rates) : (gacha.rarity_rates || null);
    const [items] = await conn.execute('SELECT id,name,rarity,img_src,weight FROM gacha_items WHERE gacha_id = ?', [id]);
    gacha.items = items;
    res.json(gacha);
  } catch (err) {
    console.error(err);
    try{ fs.appendFileSync('server-error.log', `[${new Date().toISOString()}] GET /api/gachas/:id error (${id}):\n${err.stack || err}\n\n`); }catch(e){}
    res.status(500).json({ error: 'server_error' });
  } finally { conn.release(); }
});

// POST /api/gachas (admin only)
router.post('/', requireAuth, requireRole('admin'), [
  body('title').notEmpty(),
  body('items').isArray({ min: 5 })
], async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, description, category, thumbnail, rarity_rates, items } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute('INSERT INTO gachas (title, description, category, thumbnail, rarity_rates, author_id) VALUES (?,?,?,?,?,?)',
      [title, description || null, category || null, thumbnail || null, JSON.stringify(rarity_rates || {}), req.user.id]);
    const gachaId = r.insertId;
    if (Array.isArray(items) && items.length) {
      const values = items.map(it => [gachaId, it.name, it.rarity, it.img_src || null, it.weight || 1]);
      await conn.query('INSERT INTO gacha_items (gacha_id, name, rarity, img_src, weight) VALUES ?', [values]);
    }
    await conn.commit();
    res.status(201).json({ id: gachaId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    try{ fs.appendFileSync('server-error.log', `[${new Date().toISOString()}] POST /api/gachas error:\n${err.stack || err}\n\n`); }catch(e){}
    res.status(500).json({ error: 'server_error' });
  } finally { conn.release(); }
});

// PUT /api/gachas/:id (admin only)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, category, thumbnail, rarity_rates } = req.body;
  const conn = await pool.getConnection();
  try {
    const [r] = await conn.execute('UPDATE gachas SET title=?, description=?, category=?, thumbnail=?, rarity_rates=? WHERE id=?',
      [title, description || null, category || null, thumbnail || null, JSON.stringify(rarity_rates || {}), id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    try{ fs.appendFileSync('server-error.log', `[${new Date().toISOString()}] PUT /api/gachas/${id} error:\n${err.stack || err}\n\n`); }catch(e){}
    res.status(500).json({ error: 'server_error' });
  } finally { conn.release(); }
});

// DELETE /api/gachas/:id (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.execute('DELETE FROM gachas WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    try{ fs.appendFileSync('server-error.log', `[${new Date().toISOString()}] DELETE /api/gachas/${id} error:\n${err.stack || err}\n\n`); }catch(e){}
    res.status(500).json({ error: 'server_error' });
  } finally { conn.release(); }
});

// POST /api/gachas/:id/roll
router.post('/:id/roll', requireAuth, async (req, res) => {
  const times = Math.max(1, Math.min(100, Number(req.body.times || 1)));
  const gachaId = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    const [grows] = await conn.execute('SELECT * FROM gachas WHERE id = ?', [gachaId]);
    if (!grows.length) return res.status(404).json({ error: 'not_found' });
    const [items] = await conn.execute('SELECT id,name,rarity,img_src,weight FROM gacha_items WHERE gacha_id = ?', [gachaId]);
    if (!items.length) return res.status(400).json({ error: 'no_items' });

    // build weighted pool
    const poolList = [];
    items.forEach(it => {
      const w = Math.max(1, Number(it.weight || 1));
      for (let i = 0; i < w; i++) poolList.push(it);
    });

    const results = [];
    await conn.beginTransaction();
    for (let i = 0; i < times; i++) {
      const pick = poolList[Math.floor(Math.random() * poolList.length)];
      results.push({ item_id: pick.id, name: pick.name, rarity: pick.rarity, img_src: pick.img_src, gacha_id: gachaId });
      await conn.execute('INSERT INTO gacha_rolls (user_id, gacha_id, item_id, rarity) VALUES (?,?,?,?)', [req.user.id, gachaId, pick.id, pick.rarity]);
    }
    await conn.commit();
    res.json({ results, rolls_saved: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    try{ fs.appendFileSync('server-error.log', `[${new Date().toISOString()}] POST /api/gachas/:id/roll error (${gachaId}):\n${err.stack || err}\n\n`); }catch(e){}
    res.status(500).json({ error: 'server_error' });
  } finally { conn.release(); }
});

module.exports = router;
