import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import IssueCard from '../components/IssueCard';
import IssuesMap from '../components/IssuesMap';

export default function IssuesFeed({ mine, assignedToMe, title, subtitle }) {
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [params, setParams] = useSearchParams();

  const status = params.get('status') || '';
  const department_id = params.get('department_id') || '';
  const sort = params.get('sort') || 'newest';

  const load = () => {
    setLoading(true);
    const query = {};
    if (status) query.status = status;
    if (department_id) query.department_id = department_id;
    if (sort) query.sort = sort;
    if (mine) query.mine = 'true';
    if (assignedToMe) query.assigned_to_me = 'true';
    api.get('/issues', { params: query }).then(res => setIssues(res.data.issues)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, department_id, sort]);
  useEffect(() => { api.get('/departments').then(res => setDepartments(res.data.departments)); }, []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const handleUpvoted = (updated) => {
    setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>{title || 'Community Issues'}</h1>
        <p>{subtitle || 'Browse civic issues reported across the town and see their status.'}</p>
      </div>

      <div className="filters-bar">
        <select value={status} onChange={e => updateParam('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={department_id} onChange={e => updateParam('department_id', e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={sort} onChange={e => updateParam('sort', e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="top">Most Upvoted</option>
        </select>
        <div className="view-toggle">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List</button>
          <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center">Loading issues...</div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>No issues found</h3>
          <p>Try adjusting your filters, or be the first to report an issue!</p>
        </div>
      ) : view === 'map' ? (
        <IssuesMap issues={issues} />
      ) : (
        <div className="issue-list">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} onUpvoted={handleUpvoted} />
          ))}
        </div>
      )}
    </div>
  );
}
