const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authRequired, requireRole('admin', 'officer'), (req, res) => {
  let deptFilter = '';
  const params = [];
  if (req.user.role === 'officer') {
    deptFilter = ' WHERE department_id = ?';
    params.push(req.user.department_id);
  }

  const totals = db.prepare(`SELECT COUNT(*) as total FROM issues${deptFilter}`).get(...params);
  const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM issues${deptFilter} GROUP BY status`).all(...params);
  const byCategory = db.prepare(`SELECT category, COUNT(*) as count FROM issues${deptFilter} GROUP BY category ORDER BY count DESC`).all(...params);
  const byPriority = db.prepare(`SELECT priority, COUNT(*) as count FROM issues${deptFilter} GROUP BY priority`).all(...params);
  const byDepartment = db.prepare(
    `SELECT d.name as department, COUNT(i.id) as count FROM issues i LEFT JOIN departments d ON i.department_id = d.id ${deptFilter} GROUP BY i.department_id ORDER BY count DESC`
  ).all(...params);
  const byWard = db.prepare(`SELECT ward, COUNT(*) as count FROM issues${deptFilter}${deptFilter ? ' AND' : ' WHERE'} ward IS NOT NULL GROUP BY ward ORDER BY count DESC LIMIT 10`).all(...params);

  const resolvedRows = db.prepare(
    `SELECT created_at, resolved_at FROM issues${deptFilter}${deptFilter ? ' AND' : ' WHERE'} resolved_at IS NOT NULL`
  ).all(...params);
  let avgResolutionHours = null;
  if (resolvedRows.length) {
    const totalHours = resolvedRows.reduce((sum, r) => {
      const created = new Date(r.created_at + 'Z');
      const resolved = new Date(r.resolved_at);
      return sum + (resolved - created) / (1000 * 60 * 60);
    }, 0);
    avgResolutionHours = Math.round((totalHours / resolvedRows.length) * 10) / 10;
  }

  // last 30 days trend
  const trend = db.prepare(
    `SELECT date(created_at) as day, COUNT(*) as count FROM issues${deptFilter}${deptFilter ? ' AND' : ' WHERE'} created_at >= datetime('now', '-30 days') GROUP BY day ORDER BY day ASC`
  ).all(...params);

  res.json({
    total: totals.total,
    byStatus,
    byCategory,
    byPriority,
    byDepartment,
    byWard,
    avgResolutionHours,
    trend
  });
});

module.exports = router;
