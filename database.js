const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error('Database error:', err.message);
  else console.log('✅ Connected to SQLite database');
});

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Operations Engineer',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    service TEXT,
    severity TEXT,
    status TEXT DEFAULT 'Investigating',
    priority TEXT,
    assignee TEXT,
    reporter TEXT,
    environment TEXT,
    impact TEXT,
    sla_hours INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    service TEXT,
    severity TEXT,
    value TEXT,
    threshold TEXT,
    status TEXT DEFAULT 'New',
    started_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS provisioning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE NOT NULL,
    type TEXT,
    provider TEXT,
    region TEXT,
    owner TEXT,
    purpose TEXT,
    status TEXT DEFAULT 'Pending',
    requested_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk TEXT NOT NULL,
    service TEXT,
    likelihood TEXT,
    impact TEXT,
    mitigation TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    subject TEXT,
    priority TEXT,
    status TEXT,
    assignee TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed sample data
  seedData();
});

function seedData() {
  // Check if data already exists
  db.get(`SELECT COUNT(*) as count FROM incidents`, (err, row) => {
    if (err || row.count > 0) return;

    console.log('🌱 Seeding sample data...');

    // Sample user
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Demo User', 'demo@cloudops.com', hashedPassword, 'Operations Engineer']);

    // Sample incidents
    const incidents = [
      ['INC-1042', 'Intermittent API 5xx responses', 'Gateway requests intermittently return server errors after a routing change.', 'API Gateway', 'Critical', 'Investigating', 'P1', 'A. Patel', 'Operations', 'Production', 'Checkout requests intermittently fail for customers.', 4],
      ['INC-1041', 'Storage queue delay', 'Write queue depth increased on the primary storage pool.', 'Storage', 'High', 'Identified', 'P2', 'M. Shah', 'Monitoring', 'Production', 'Some uploads take longer than expected.', 12],
      ['INC-1040', 'Kubernetes memory pressure', 'One workload is repeatedly approaching its memory limit.', 'Kubernetes', 'Medium', 'Monitoring', 'P3', 'R. Iyer', 'Platform team', 'Staging', 'No confirmed customer impact.', 24],
      ['INC-1039', 'Database connection saturation', 'Connection pool became saturated during scheduled batch job.', 'Database', 'Medium', 'Resolved', 'P2', 'S. Rao', 'Monitoring', 'Production', 'Elevated response latency for reporting users.', 8],
      ['INC-1038', 'Network throughput dip', 'Short-lived throughput degradation on internal link.', 'Network', 'Low', 'Closed', 'P4', 'N. Desai', 'Support', 'Production', 'Brief delay for small subset of internal jobs.', 24],
      ['INC-1037', 'Compute CPU burst', 'Unscheduled compute workload briefly increased CPU utilization.', 'Compute', 'Low', 'Investigating', 'P3', 'Unassigned', 'Monitoring', 'Development', 'No customer-facing impact confirmed.', 24]
    ];
    incidents.forEach(i => {
      db.run(`INSERT INTO incidents (incident_id, title, description, service, severity, status, priority, assignee, reporter, environment, impact, sla_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, i);
    });

    // Sample alerts
    const alerts = [
      ['AL-301', 'Elevated gateway 5xx errors', 'API Gateway', 'Critical', '4.8%', '> 2%', 'New'],
      ['AL-302', 'Storage capacity approaching limit', 'Storage', 'High', '82%', '> 80%', 'New'],
      ['AL-303', 'Database request latency', 'Database', 'Medium', '91 ms', '> 80 ms', 'Acknowledged'],
      ['AL-304', 'Compute CPU burst', 'Compute', 'Low', '76%', '> 75%', 'Resolved'],
      ['AL-305', 'Kubernetes memory pressure', 'Kubernetes', 'Medium', '68%', '> 65%', 'New'],
      ['AL-306', 'Network throughput dip', 'Network', 'Low', '418 Mbps', '< 450 Mbps', 'Acknowledged']
    ];
    alerts.forEach(a => {
      db.run(`INSERT INTO alerts (alert_id, name, service, severity, value, threshold, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, a);
    });

    // Sample provisioning
    const provisioning = [
      ['REQ-204', 'Virtual Machine', 'AWS', 'ap-south-1', 'R. Iyer', 'Staging web node', 'Pending'],
      ['REQ-203', 'Managed Database', 'Azure', 'eu-west-1', 'S. Rao', 'Development reporting DB', 'Approved'],
      ['REQ-202', 'Object Storage', 'GCP', 'us-east-1', 'A. Patel', 'Production asset bucket', 'Rejected'],
      ['REQ-201', 'Container', 'AWS', 'ap-south-1', 'M. Shah', 'Batch job runtime', 'Approved']
    ];
    provisioning.forEach(p => {
      db.run(`INSERT INTO provisioning (request_id, type, provider, region, owner, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, p);
    });

    // Sample risks
    const risks = [
      ['Public bucket access', 'Storage', 'High', 'Critical', 'Enable block-public-access; audit policies'],
      ['Over-permissive service role', 'Compute', 'Medium', 'High', 'Least-privilege IAM review'],
      ['Unpatched base image', 'Kubernetes', 'Medium', 'High', 'Automated image scanning'],
      ['Single NAT gateway', 'Network', 'Low', 'Medium', 'Deploy NAT across AZs'],
      ['Weak encryption key rotation', 'Database', 'Low', 'High', 'Enable automatic key rotation']
    ];
    risks.forEach(r => {
      db.run(`INSERT INTO risks (risk, service, likelihood, impact, mitigation) VALUES (?, ?, ?, ?, ?)`, r);
    });

    // Sample support tickets
    const tickets = [
      ['SUP-503', 'API timeout reports', 'High', 'Open', 'A. Patel'],
      ['SUP-502', 'Storage quota question', 'Medium', 'In progress', 'M. Shah'],
      ['SUP-501', 'Billing breakdown request', 'Low', 'Resolved', 'N. Desai'],
      ['SUP-500', 'Access to monitoring dashboard', 'Medium', 'Resolved', 'R. Iyer']
    ];
    tickets.forEach(t => {
      db.run(`INSERT INTO support_tickets (ticket_id, subject, priority, status, assignee) VALUES (?, ?, ?, ?, ?)`, t);
    });

    console.log('✅ Sample data seeded. Demo login: demo@cloudops.com / demo123');
  });
}

module.exports = db;