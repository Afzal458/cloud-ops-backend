const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'cloud-ops-secret';

function verifyAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/', verifyAuth, (req, res) => {
  db.all(`SELECT * FROM incidents ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', verifyAuth, (req, res) => {
  const { title, description, service, severity, priority, assignee, reporter, environment, impact, sla_hours } = req.body;
  if (!title || !description || !impact || !reporter) {
    return res.status(400).json({ error: 'Title, description, impact and reporter are required' });
  }
  const incident_id = 'INC-' + Date.now();
  db.run(`INSERT INTO incidents (incident_id, title, description, service, severity, priority, assignee, reporter, environment, impact, sla_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [incident_id, title, description, service, severity, priority, assignee || 'Unassigned', reporter, environment, impact, sla_hours || 24],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(`SELECT * FROM incidents WHERE id = ?`, [this.lastID], (err, row) => {
        res.json(row);
      });
    });
});

router.patch('/:id', verifyAuth, (req, res) => {
  const { status, severity, assignee } = req.body;
  const fields = [];
  const values = [];
  if (status) { fields.push('status = ?'); values.push(status); }
  if (severity) { fields.push('severity = ?'); values.push(severity); }
  if (assignee) { fields.push('assignee = ?'); values.push(assignee); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  db.run(`UPDATE incidents SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT * FROM incidents WHERE id = ?`, [req.params.id], (err, row) => {
      res.json(row);
    });
  });
});

router.delete('/:id', verifyAuth, (req, res) => {
  db.run(`DELETE FROM incidents WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;