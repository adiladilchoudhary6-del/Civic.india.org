const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const departments = db.prepare('SELECT * FROM departments ORDER BY name').all();
  res.json({ departments });
});

router.post('/', authRequired, requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const info = db.prepare('INSERT INTO departments (name, description) VALUES (?, ?)').run(name, description || null);
    res.status(201).json({ department: db.prepare('SELECT * FROM departments WHERE id = ?').get(info.lastInsertRowid) });
  } catch (e) {
    res.status(409).json({ error: 'Department already exists' });
  }
});

module.exports = router;
