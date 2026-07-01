const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function sanitize(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// Admin: list all users (optionally filter by role/department)
router.get('/', authRequired, requireRole('admin'), (req, res) => {
  const { role, department_id } = req.query;
  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  if (role) { query += ' AND role = ?'; params.push(role); }
  if (department_id) { query += ' AND department_id = ?'; params.push(department_id); }
  query += ' ORDER BY created_at DESC';
  const users = db.prepare(query).all(...params).map(sanitize);
  res.json({ users });
});

// Public-ish: list officers (for assignment dropdowns) - admin/officer only
router.get('/officers', authRequired, requireRole('admin', 'officer'), (req, res) => {
  const { department_id } = req.query;
  let query = `SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'officer'`;
  const params = [];
  if (department_id) { query += ' AND u.department_id = ?'; params.push(department_id); }
  const officers = db.prepare(query).all(...params).map(sanitize);
  res.json({ officers });
});

// Admin: create an officer or admin account
router.post('/', authRequired, requireRole('admin'), (req, res) => {
  const { name, email, phone, password, role, department_id } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, role are required' });
  }
  if (!['officer', 'admin', 'citizen'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (role === 'officer' && !department_id) {
    return res.status(400).json({ error: 'Officer must belong to a department' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, email, phone || null, hash, role, department_id || null);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ user: sanitize(user) });
});

// Admin: update user (e.g. reassign department, change role)
router.patch('/:id', authRequired, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { name, department_id, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET name = COALESCE(?, name), department_id = COALESCE(?, department_id), role = COALESCE(?, role) WHERE id = ?')
    .run(name || null, department_id || null, role || null, id);

  res.json({ user: sanitize(db.prepare('SELECT * FROM users WHERE id = ?').get(id)) });
});

// Admin: delete user
router.delete('/:id', authRequired, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
