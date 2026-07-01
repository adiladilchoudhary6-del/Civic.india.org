# CivicConnect — Civic Issue Reporting & Resolution Platform

A full-stack government platform where citizens report local civic problems
(potholes, water issues, garbage, streetlights, safety hazards, etc.), and
government officers/admins track, prioritize, and resolve them transparently.

## Tech Stack
- **Frontend:** React 19 (Vite), React Router, Recharts (analytics), Leaflet (maps)
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3) — file-based, zero setup, upgradeable to PostgreSQL later
- **Auth:** JWT-based, role-based access control (citizen / officer / admin)

## Features
- Citizen sign-up/login, issue reporting with photo + GPS location
- Auto-routing of issues to the correct government department
- Community feed with list & map views, filters, upvoting, comments
- Status timeline (Pending → Acknowledged → In Progress → Resolved/Rejected)
- Officer dashboard scoped to their department; assign issues to themselves/colleagues
- Admin dashboard: town-wide analytics (status/category/department/ward breakdowns,
  average resolution time, 30-day trend), full issue management, user management
  (create officers/admins per department)

## Project Structure
```
civic-app/
├── server/          Express API + SQLite database
│   ├── db/          schema.sql, db connection
│   ├── routes/       auth, issues, departments, users, stats
│   ├── middleware/   JWT auth middleware
│   ├── uploads/      uploaded issue photos
│   └── seed.js       sample departments, officers, admin, citizens, issues
├── client/          React frontend (Vite)
│   └── src/
│       ├── pages/        Landing, Login, Signup, ReportIssue, IssuesFeed, IssueDetail, Dashboard, ManageUsers
│       └── components/   Navbar, IssueCard, IssuesMap, Badges, ProtectedRoute
└── start.sh         One-command launcher (installs deps, seeds DB, starts both servers)
```

## Running Locally

```bash
cd civic-app
./start.sh
```

This will:
1. Install server & client dependencies (first run only)
2. Seed the database with departments, an admin, one officer per department, sample citizens, and sample issues
3. Start the backend at **http://localhost:4000**
4. Start the frontend at **http://localhost:5173**

Logs are written to `/tmp/civic-server.log` and `/tmp/civic-client.log`.

### Manual start (alternative)
```bash
# Terminal 1
cd civic-app/server
npm install
npm run seed     # only needed once
npm start

# Terminal 2
cd civic-app/client
npm install
npm run dev
```

## Demo Accounts
| Role    | Email                              | Password     |
|---------|-------------------------------------|--------------|
| Admin   | admin@civicconnect.gov              | Admin@123    |
| Officer | roads.officer@civicconnect.gov      | Officer@123  |
| Officer | water.officer@civicconnect.gov      | Officer@123  |
| Officer | sanitation.officer@civicconnect.gov | Officer@123  |
| Officer | electricity.officer@civicconnect.gov| Officer@123  |
| Officer | safety.officer@civicconnect.gov     | Officer@123  |
| Officer | parks.officer@civicconnect.gov      | Officer@123  |
| Citizen | ravi@example.com                    | Citizen@123  |

New citizens can also self-register via the Sign Up page. Only admins can create
officer/admin accounts (via **Manage Users** in the dashboard).

## Deploying to Production

This app is deployment-ready for platforms like **Render**, **Railway**, or a VPS.

### Option A: Render / Railway (easiest)
1. Push this repo to GitHub.
2. **Backend:** Create a new Web Service pointing to `civic-app/server`.
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables: `JWT_SECRET` (a long random string), `PORT` (usually auto-set)
   - Note: SQLite file storage works but isn't persistent on most PaaS free tiers unless
     you attach a persistent volume/disk. For production-grade reliability, migrate to
     managed PostgreSQL (see "Upgrading the database" below).
3. **Frontend:** Create a Static Site pointing to `civic-app/client`.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Set the API base URL: update `client/src/api.js` `baseURL` to your deployed backend
     URL (e.g. `https://your-backend.onrender.com/api`), or set up a reverse proxy/rewrite.

### Option B: Single VPS (e.g. DigitalOcean, EC2)
1. Install Node.js 20+ on the server.
2. Clone the repo, run `cd server && npm install && npm run seed && npm start`
   (use `pm2` or `systemd` to keep it running).
3. Build the frontend: `cd client && npm install && npm run build`
4. Serve the `client/dist` folder via Nginx, and reverse-proxy `/api` and `/uploads`
   to the Node backend on port 4000.
5. Add HTTPS via Let's Encrypt/Certbot.

### Upgrading the database (recommended for real government use)
For a live public deployment, swap SQLite for **PostgreSQL**:
- Replace `better-sqlite3` with `pg` (or use an ORM like Prisma/Sequelize).
- Adjust `server/db/schema.sql` syntax slightly (e.g. `SERIAL` instead of `AUTOINCREMENT`).
- Point uploaded photos to cloud storage (S3/Cloudinary) instead of local disk,
  since most PaaS platforms wipe local files on redeploy.

### Security checklist before going live
- Set a strong, secret `JWT_SECRET` via environment variable (not the default dev value).
- Enable HTTPS everywhere.
- Add rate limiting (e.g. `express-rate-limit`) on auth and issue-creation routes.
- Restrict CORS to your actual frontend domain instead of `*`.
- Add email/OTP verification for citizen signups if desired.
- Regularly back up the database.

## Notes
- Departments and their officer accounts are pre-seeded to represent a real
  municipal structure (Roads, Water, Sanitation, Electricity, Public Safety, Parks).
  You can rename or add departments via the API (`POST /api/departments`, admin only).
- The category → department mapping used during issue reporting lives in
  `client/src/pages/ReportIssue.jsx` (`CATEGORY_MAP`) — edit it to match your town's needs.
