import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './Badges';
import { useAuth } from '../AuthContext';
import { formatDistanceToNow } from 'date-fns';
import api, { resolveUploadUrl } from '../api';

export default function IssueCard({ issue, onUpvoted }) {
  const { user } = useAuth();

  const toggleUpvote = async (e) => {
    e.preventDefault();
    if (!user) return;
    const res = await api.post(`/issues/${issue.id}/upvote`);
    onUpvoted && onUpvoted(res.data.issue);
  };

  return (
    <Link to={`/issues/${issue.id}`} className="issue-card">
      {issue.photo_path
        ? <img className="issue-thumb" src={resolveUploadUrl(issue.photo_path)} alt={issue.title} />
        : <div className="issue-thumb-placeholder">📷</div>}
      <div className="issue-card-body">
        <div className="issue-card-top">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          {issue.department_name && <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>{issue.department_name}</span>}
        </div>
        <h3>{issue.title}</h3>
        <p className="desc">{issue.description}</p>
        <div className="meta">
          <span>📍 {issue.address || issue.ward || 'Location not specified'}</span>
          <span>🗓️ {formatDistanceToNow(new Date(issue.created_at + 'Z'), { addSuffix: true })}</span>
          <span>👤 {issue.reporter_name}</span>
        </div>
      </div>
      <button className={`upvote-btn ${issue.upvoted ? 'active' : ''}`} onClick={toggleUpvote} title={user ? 'Upvote this issue' : 'Log in to upvote'}>
        <span>▲</span>
        <span className="count">{issue.upvote_count}</span>
      </button>
    </Link>
  );
}
