import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#1d4ed8', '#f59e0b', '#16a34a', '#dc2626', '#7c3aed', '#0891b2'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [tab, setTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('');

  const loadStats = () => api.get('/stats/overview').then(res => setStats(res.data));
  const loadIssues = () => {
    const query = {};
    if (filterStatus) query.status = filterStatus;
    api.get('/issues', { params: query }).then(res => setIssues(res.data.issues));
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadIssues(); /* eslint-disable-next-line */ }, [filterStatus]);

  if (!stats) return <div className="loading-center">Loading dashboard...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>{user.role === 'admin' ? 'Government Admin Dashboard' : `${user.department_id ? '' : ''}Department Dashboard`}</h1>
        <p>Monitor, prioritize, and resolve civic issues reported by citizens.</p>
      </div>

      <div className="tabs">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview & Analytics</button>
        <button className={tab === 'manage' ? 'active' : ''} onClick={() => setTab('manage')}>Manage Issues</button>
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="card stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Issues</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.byStatus.find(s => s.status === 'pending')?.count || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.byStatus.find(s => s.status === 'resolved')?.count || 0}</div>
              <div className="stat-label">Resolved</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.avgResolutionHours ? `${stats.avgResolutionHours}h` : '—'}</div>
              <div className="stat-label">Avg. Resolution Time</div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Issues by Status</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                    {stats.byStatus.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Issues by Category</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1d4ed8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {user.role === 'admin' && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Issues by Department</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.byDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="department" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Reports Trend (last 30 days)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'manage' && (
        <div className="card">
          <div className="filters-bar" style={{ marginBottom: 14 }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  {user.role === 'admin' && <th>Department</th>}
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reported</th>
                  <th>Upvotes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {issues.map(i => (
                  <tr key={i.id}>
                    <td>{i.title}</td>
                    <td>{i.category}</td>
                    {user.role === 'admin' && <td>{i.department_name || '—'}</td>}
                    <td><PriorityBadge priority={i.priority} /></td>
                    <td><StatusBadge status={i.status} /></td>
                    <td>{format(new Date(i.created_at + 'Z'), 'PP')}</td>
                    <td>{i.upvote_count}</td>
                    <td><Link to={`/issues/${i.id}`}><button className="btn btn-outline btn-sm">Manage</button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {issues.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20 }}>No issues found for this filter.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
