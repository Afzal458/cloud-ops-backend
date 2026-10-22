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

// ALERTS
router.get('/alerts', verifyAuth, (req, res) => {
  db.all(`SELECT * FROM alerts ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.patch('/alerts/:id', verifyAuth, (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE alerts SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT * FROM alerts WHERE id = ?`, [req.params.id], (err, row) => res.json(row));
  });
});

// PROVISIONING
router.get('/provisioning', verifyAuth, (req, res) => {
  db.all(`SELECT * FROM provisioning ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/provisioning', verifyAuth, (req, res) => {
  const { type, provider, region, owner, purpose } = req.body;
  if (!type || !provider || !owner || !purpose) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const request_id = 'REQ-' + Date.now();
  db.run(`INSERT INTO provisioning (request_id, type, provider, region, owner, purpose) VALUES (?, ?, ?, ?, ?, ?)`,
    [request_id, type, provider, region, owner, purpose],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(`SELECT * FROM provisioning WHERE id = ?`, [this.lastID], (err, row) => res.json(row));
    });
});

router.patch('/provisioning/:id', verifyAuth, (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE provisioning SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT * FROM provisioning WHERE id = ?`, [req.params.id], (err, row) => res.json(row));
  });
});

// RISKS
router.get('/risks', verifyAuth, (req, res) => {
  db.all(`SELECT * FROM risks`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// SUPPORT TICKETS
router.get('/support', verifyAuth, (req, res) => {
  db.all(`SELECT * FROM support_tickets ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// STATS
router.get('/stats', verifyAuth, (req, res) => {
  db.get(`SELECT COUNT(*) as total FROM incidents`, [], (err, inc) => {
    db.get(`SELECT COUNT(*) as total FROM incidents WHERE status NOT IN ('Resolved','Closed')`, [], (err, open) => {
      db.get(`SELECT COUNT(*) as total FROM alerts WHERE status != 'Resolved'`, [], (err, alerts) => {
        db.get(`SELECT COUNT(*) as total FROM provisioning`, [], (err, prov) => {
          db.get(`SELECT COUNT(*) as total FROM risks`, [], (err, risks) => {
            res.json({
              incidents: inc?.total || 0,
              openIncidents: open?.total || 0,
              activeAlerts: alerts?.total || 0,
              provisioning: prov?.total || 0,
              risks: risks?.total || 0
            });
          });
        });
      });
    });
  });
});

module.exports = router;