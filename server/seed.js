// Seed script: creates departments, an admin, officers, sample citizens and issues.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

console.log('Seeding CivicConnect database...');

const departments = [
  { name: 'Roads & Infrastructure', description: 'Potholes, road damage, footpaths, bridges' },
  { name: 'Water Supply', description: 'Leaks, contamination, low pressure, pipeline issues' },
  { name: 'Sanitation & Waste', description: 'Garbage collection, dumping, drainage, sewage' },
  { name: 'Electricity & Streetlights', description: 'Power outages, broken streetlights, exposed wiring' },
  { name: 'Public Safety', description: 'Encroachment, illegal construction, safety hazards' },
  { name: 'Parks & Environment', description: 'Parks, trees, pollution, public spaces' }
];

const insertDept = db.prepare('INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)');
departments.forEach(d => insertDept.run(d.name, d.description));

const deptRows = db.prepare('SELECT * FROM departments').all();
const deptByName = Object.fromEntries(deptRows.map(d => [d.name, d]));

function upsertUser({ name, email, phone, password, role, department_id, ward }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return existing.id;
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role, department_id, ward) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(name, email, phone || null, hash, role, department_id || null, ward || null);
  return info.lastInsertRowid;
}

// Super Admin
const adminId = upsertUser({
  name: 'Town Super Admin',
  email: 'admin@civicconnect.gov',
  password: 'Admin@123',
  role: 'admin'
});

// Officers, one per department
const officerCreds = [
  { name: 'Officer Rajesh Kumar', email: 'roads.officer@civicconnect.gov', dept: 'Roads & Infrastructure' },
  { name: 'Officer Sunita Verma', email: 'water.officer@civicconnect.gov', dept: 'Water Supply' },
  { name: 'Officer Anil Sharma', email: 'sanitation.officer@civicconnect.gov', dept: 'Sanitation & Waste' },
  { name: 'Officer Priya Nair', email: 'electricity.officer@civicconnect.gov', dept: 'Electricity & Streetlights' },
  { name: 'Officer Vikram Singh', email: 'safety.officer@civicconnect.gov', dept: 'Public Safety' },
  { name: 'Officer Meena Iyer', email: 'parks.officer@civicconnect.gov', dept: 'Parks & Environment' }
];
const officerIds = {};
officerCreds.forEach(o => {
  const id = upsertUser({ name: o.name, email: o.email, password: 'Officer@123', role: 'officer', department_id: deptByName[o.dept].id });
  officerIds[o.dept] = id;
});

// Sample citizens
const citizens = [
  { name: 'Ravi Patel', email: 'ravi@example.com', ward: 'Ward 3' },
  { name: 'Anjali Mehta', email: 'anjali@example.com', ward: 'Ward 5' },
  { name: 'Sameer Khan', email: 'sameer@example.com', ward: 'Ward 1' }
];
const citizenIds = citizens.map(c => upsertUser({ name: c.name, email: c.email, password: 'Citizen@123', role: 'citizen', ward: c.ward }));

// Sample issues (only if none exist yet)
const issueCount = db.prepare('SELECT COUNT(*) as c FROM issues').get().c;
if (issueCount === 0) {
  const sampleIssues = [
    {
      title: 'Large pothole on Main Street causing accidents',
      description: 'A deep pothole near the Main Street market has caused two bike accidents this week. Needs urgent repair.',
      category: 'Pothole', dept: 'Roads & Infrastructure', priority: 'critical', status: 'in_progress',
      ward: 'Ward 3', reporter: citizenIds[0], officer: officerIds['Roads & Infrastructure'], lat: 19.0760, lng: 72.8777,
      address: 'Main Street, near Central Market'
    },
    {
      title: 'No water supply for 3 days in Ward 5',
      description: 'Residents of Ward 5 have had no piped water supply for three consecutive days.',
      category: 'Water Shortage', dept: 'Water Supply', priority: 'high', status: 'acknowledged',
      ward: 'Ward 5', reporter: citizenIds[1], officer: officerIds['Water Supply'], lat: 19.0800, lng: 72.8800,
      address: 'Sector 5, Ward 5'
    },
    {
      title: 'Garbage not collected for a week',
      description: 'Household garbage is piling up on the street corner, attracting stray animals and creating a health hazard.',
      category: 'Garbage Collection', dept: 'Sanitation & Waste', priority: 'high', status: 'pending',
      ward: 'Ward 1', reporter: citizenIds[2], lat: 19.0700, lng: 72.8700,
      address: 'Lane 4, Ward 1'
    },
    {
      title: 'Streetlight broken near school',
      description: 'The streetlight outside the primary school has not worked in over a month, making it unsafe for children returning from evening classes.',
      category: 'Streetlight', dept: 'Electricity & Streetlights', priority: 'medium', status: 'resolved',
      ward: 'Ward 3', reporter: citizenIds[0], officer: officerIds['Electricity & Streetlights'], lat: 19.0750, lng: 72.8750,
      address: 'Near Govt Primary School, Ward 3', resolved: true
    },
    {
      title: 'Illegal encroachment blocking footpath',
      description: 'A vendor has permanently set up a stall that blocks the entire footpath, forcing pedestrians onto the busy road.',
      category: 'Encroachment', dept: 'Public Safety', priority: 'medium', status: 'pending',
      ward: 'Ward 5', reporter: citizenIds[1], lat: 19.0820, lng: 72.8820,
      address: 'Station Road, Ward 5'
    },
    {
      title: 'Overflowing drain causing waterlogging',
      description: 'Heavy rains have caused a blocked drain to overflow, flooding the street and homes nearby.',
      category: 'Drainage', dept: 'Sanitation & Waste', priority: 'critical', status: 'in_progress',
      ward: 'Ward 1', reporter: citizenIds[2], officer: officerIds['Sanitation & Waste'], lat: 19.0690, lng: 72.8690,
      address: 'Riverside Road, Ward 1'
    },
    {
      title: 'Park equipment damaged and unsafe for kids',
      description: 'The swings and slides in the community park are broken and rusted, posing an injury risk to children.',
      category: 'Park Maintenance', dept: 'Parks & Environment', priority: 'low', status: 'pending',
      ward: 'Ward 3', reporter: citizenIds[0], lat: 19.0770, lng: 72.8770,
      address: 'Community Park, Ward 3'
    }
  ];

  const insertIssue = db.prepare(
    `INSERT INTO issues (title, description, category, department_id, priority, status, latitude, longitude, address, ward, reporter_id, assigned_officer_id, upvote_count, created_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?)`
  );
  const insertHistory = db.prepare('INSERT INTO issue_status_history (issue_id, status, note, changed_by) VALUES (?, ?, ?, ?)');

  sampleIssues.forEach((s, idx) => {
    const daysAgo = `-${(sampleIssues.length - idx) * 2} days`;
    const info = insertIssue.run(
      s.title, s.description, s.category, deptByName[s.dept].id, s.priority, s.status,
      s.lat, s.lng, s.address, s.ward, s.reporter, s.officer || null,
      Math.floor(Math.random() * 15),
      daysAgo,
      s.resolved ? new Date().toISOString() : null
    );
    insertHistory.run(info.lastInsertRowid, 'pending', 'Issue reported', s.reporter);
    if (s.status !== 'pending') {
      insertHistory.run(info.lastInsertRowid, s.status, 'Status updated', s.officer || adminId);
    }
  });

  console.log(`Inserted ${sampleIssues.length} sample issues.`);
}

console.log('\n✅ Seed complete!\n');
console.log('Login credentials:');
console.log('  Admin:    admin@civicconnect.gov / Admin@123');
console.log('  Officer:  roads.officer@civicconnect.gov / Officer@123 (one per department, pattern: <dept>.officer@civicconnect.gov)');
console.log('  Citizen:  ravi@example.com / Citizen@123');
