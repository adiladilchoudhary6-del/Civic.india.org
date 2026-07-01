const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  }
});

function attachExtras(issue, userId) {
  const reporter = db.prepare('SELECT id, name FROM users WHERE id = ?').get(issue.reporter_id);
  const officer = issue.assigned_officer_id
    ? db.prepare('SELECT id, name FROM users WHERE id = ?').get(issue.assigned_officer_id)
    : null;
  const department = issue.department_id
    ? db.prepare('SELECT id, name FROM departments WHERE id = ?').get(issue.department_id)
    : null;
  const upvoted = userId
    ? !!db.prepare('SELECT 1 FROM issue_upvotes WHERE issue_id = ? AND user_id = ?').get(issue.id, userId)
    : false;
  return { ...issue, reporter_name: reporter ? reporter.name : null, officer_name: officer ? officer.name : null, department_name: department ? department.name : null, upvoted };
}

// List issues with filters (public feed - anyone can view, but scoping applied for officers)
router.get('/', optionalAuth, (req, res) => {
  const { status, category, department_id, ward, mine, assigned_to_me, sort } = req.query;
  let query = 'SELECT * FROM issues WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (department_id) { query += ' AND department_id = ?'; params.push(department_id); }
  if (ward) { query += ' AND ward = ?'; params.push(ward); }

  if (mine === 'true' && req.user) { query += ' AND reporter_id = ?'; params.push(req.user.id); }
  if (assigned_to_me === 'true' && req.user) { query += ' AND assigned_officer_id = ?'; params.push(req.user.id); }

  // Officers by default only see their department's issues unless mine/assigned filters used
  if (req.user && req.user.role === 'officer' && !department_id) {
    query += ' AND department_id = ?';
    params.push(req.user.department_id);
  }

  if (sort === 'top') query += ' ORDER BY upvote_count DESC, created_at DESC';
  else if (sort === 'oldest') query += ' ORDER BY created_at ASC';
  else query += ' ORDER BY created_at DESC';

  const issues = db.prepare(query).all(...params).map(i => attachExtras(i, req.user && req.user.id));
  res.json({ issues });
});

// Get single issue with comments + history
router.get('/:id', optionalAuth, (req, res) => {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  const comments = db.prepare(
    `SELECT c.*, u.name as user_name, u.role as user_role FROM issue_comments c
     JOIN users u ON u.id = c.user_id WHERE c.issue_id = ? ORDER BY c.created_at ASC`
  ).all(req.params.id);

  const history = db.prepare(
    `SELECT h.*, u.name as changed_by_name FROM issue_status_history h
     LEFT JOIN users u ON u.id = h.changed_by WHERE h.issue_id = ? ORDER BY h.created_at ASC`
  ).all(req.params.id);

  res.json({ issue: attachExtras(issue, req.user && req.user.id), comments, history });
});

// Create issue (citizens report)
router.post('/', authRequired, upload.single('photo'), (req, res) => {
  const { title, description, category, department_id, latitude, longitude, address, ward, priority } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description and category are required' });
  }
  const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

  const info = db.prepare(
    `INSERT INTO issues (title, description, category, department_id, priority, latitude, longitude, address, ward, photo_path, reporter_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    title, description, category,
    department_id || null,
    priority || 'medium',
    latitude ? parseFloat(latitude) : null,
    longitude ? parseFloat(longitude) : null,
    address || null,
    ward || null,
    photo_path,
    req.user.id
  );

  db.prepare('INSERT INTO issue_status_history (issue_id, status, note, changed_by) VALUES (?, ?, ?, ?)')
    .run(info.lastInsertRowid, 'pending', 'Issue reported', req.user.id);

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ issue: attachExtras(issue, req.user.id) });
});

// Upvote / un-upvote an issue
router.post('/:id/upvote', authRequired, (req, res) => {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  const existing = db.prepare('SELECT * FROM issue_upvotes WHERE issue_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) {
    db.prepare('DELETE FROM issue_upvotes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE issues SET upvote_count = upvote_count - 1 WHERE id = ?').run(req.params.id);
  } else {
    db.prepare('INSERT INTO issue_upvotes (issue_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id);
    db.prepare('UPDATE issues SET upvote_count = upvote_count + 1 WHERE id = ?').run(req.params.id);
  }
  const updated = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  res.json({ issue: attachExtras(updated, req.user.id) });
});

// Add comment
router.post('/:id/comments', authRequired, (req, res) => {
  const { comment } = req.body;
  if (!comment || !comment.trim()) return res.status(400).json({ error: 'Comment required' });
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  db.prepare('INSERT INTO issue_comments (issue_id, user_id, comment) VALUES (?, ?, ?)').run(req.params.id, req.user.id, comment.trim());
  const comments = db.prepare(
    `SELECT c.*, u.name as user_name, u.role as user_role FROM issue_comments c
     JOIN users u ON u.id = c.user_id WHERE c.issue_id = ? ORDER BY c.created_at ASC`
  ).all(req.params.id);
  res.status(201).json({ comments });
});

// Officer/Admin: update status, assign, priority, department, resolution
router.patch('/:id', authRequired, requireRole('officer', 'admin'), upload.single('resolution_photo'), (req, res) => {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  if (req.user.role === 'officer' && issue.department_id !== req.user.department_id) {
    return res.status(403).json({ error: 'You can only manage issues in your department' });
  }

  const { status, priority, department_id, assigned_officer_id, resolution_notes, note } = req.body;
  const resolution_photo_path = req.file ? `/uploads/${req.file.filename}` : issue.resolution_photo_path;

  const newStatus = status || issue.status;
  const resolvedAt = newStatus === 'resolved' ? new Date().toISOString() : (newStatus === 'pending' || newStatus === 'in_progress' || newStatus === 'acknowledged' ? null : issue.resolved_at);

  db.prepare(
    `UPDATE issues SET
      status = ?, priority = COALESCE(?, priority), department_id = COALESCE(?, department_id),
      assigned_officer_id = COALESCE(?, assigned_officer_id), resolution_notes = COALESCE(?, resolution_notes),
      resolution_photo_path = ?, updated_at = datetime('now'),
      resolved_at = ?
     WHERE id = ?`
  ).run(
    newStatus,
    priority || null,
    department_id || null,
    assigned_officer_id || null,
    resolution_notes || null,
    resolution_photo_path,
    resolvedAt,
    req.params.id
  );

  if (status && status !== issue.status) {
    db.prepare('INSERT INTO issue_status_history (issue_id, status, note, changed_by) VALUES (?, ?, ?, ?)')
      .run(req.params.id, status, note || null, req.user.id);
  }

  const updated = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  res.json({ issue: attachExtras(updated, req.user.id) });
});

// Delete issue (admin only, or reporter if still pending)
router.delete('/:id', authRequired, (req, res) => {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  const isOwnerPending = issue.reporter_id === req.user.id && issue.status === 'pending';
  if (req.user.role !== 'admin' && !isOwnerPending) {
    return res.status(403).json({ error: 'Not allowed to delete this issue' });
  }
  db.prepare('DELETE FROM issues WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
