import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { resolveUploadUrl } from '../api';
import { useAuth } from '../AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { format } from 'date-fns';

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [officers, setOfficers] = useState([]);
  const [statusForm, setStatusForm] = useState({ status: '', assigned_officer_id: '', resolution_notes: '', note: '' });
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get(`/issues/${id}`).then(res => {
      setData(res.data);
      setStatusForm(f => ({ ...f, status: res.data.issue.status }));
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'officer')) {
      const deptId = user.role === 'officer' ? user.department_id : data?.issue?.department_id;
      if (deptId) api.get('/users/officers', { params: { department_id: deptId } }).then(res => setOfficers(res.data.officers));
    }
  }, [user, data]);

  if (!data) return <div className="loading-center">Loading issue...</div>;
  const { issue, comments, history } = data;

  const canManage = user && (user.role === 'admin' || (user.role === 'officer' && user.department_id === issue.department_id));

  const toggleUpvote = async () => {
    if (!user) return navigate('/login');
    const res = await api.post(`/issues/${id}/upvote`);
    setData(d => ({ ...d, issue: { ...d.issue, ...res.data.issue } }));
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) return navigate('/login');
    const res = await api.post(`/issues/${id}/comments`, { comment: commentText });
    setData(d => ({ ...d, comments: res.data.comments }));
    setCommentText('');
  };

  const submitStatusUpdate = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const fd = new FormData();
      Object.entries(statusForm).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (resolutionPhoto) fd.append('resolution_photo', resolutionPhoto);
      const res = await api.patch(`/issues/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Issue updated successfully.');
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div className="issue-card-top">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          {issue.department_name && <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>{issue.department_name}</span>}
        </div>
        <h1>{issue.title}</h1>
        <p>Reported by {issue.reporter_name} · {format(new Date(issue.created_at + 'Z'), 'PPP p')}</p>
      </div>

      <div className="issue-detail-grid">
        <div>
          <div className="card">
            {issue.photo_path && <img className="issue-photo" src={resolveUploadUrl(issue.photo_path)} alt={issue.title} />}
            <p>{issue.description}</p>
            <div className="meta" style={{ marginBottom: 16 }}>
              <span>📍 {issue.address || 'No address given'}{issue.ward ? ` · ${issue.ward}` : ''}</span>
              {issue.latitude && <span>🌐 {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</span>}
              {issue.officer_name && <span>🧑‍💼 Assigned: {issue.officer_name}</span>}
            </div>
            <button className={`upvote-btn ${issue.upvoted ? 'active' : ''}`} onClick={toggleUpvote}>
              <span>▲ Upvote</span>
              <span className="count">{issue.upvote_count}</span>
            </button>

            {issue.status === 'resolved' && issue.resolution_notes && (
              <div className="form-success" style={{ marginTop: 16 }}>
                <b>Resolution:</b> {issue.resolution_notes}
              </div>
            )}
            {issue.resolution_photo_path && (
              <img className="issue-photo" src={resolveUploadUrl(issue.resolution_photo_path)} alt="resolution" style={{ marginTop: 12 }} />
            )}
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3 style={{ marginTop: 0 }}>Discussion ({comments.length})</h3>
            {comments.map(c => (
              <div className="comment" key={c.id}>
                <div className="comment-head">
                  {c.user_name} <span className="comment-role">{c.user_role}</span>
                </div>
                <p>{c.comment}</p>
              </div>
            ))}
            {comments.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>No comments yet.</p>}
            {user ? (
              <form onSubmit={submitComment} style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <input className="form-control" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment or update..." />
                <button className="btn btn-primary" type="submit">Post</button>
              </form>
            ) : (
              <p style={{ fontSize: '0.85rem', marginTop: 12 }}><a href="/login" style={{ color: 'var(--color-primary)' }}>Log in</a> to join the discussion.</p>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Status Timeline</h3>
            <ul className="timeline">
              {history.map(h => (
                <li key={h.id}>
                  <div className="t-status">{h.status.replace('_', ' ').toUpperCase()}</div>
                  {h.note && <div style={{ fontSize: '0.82rem', margin: '2px 0' }}>{h.note}</div>}
                  <div className="t-meta">{h.changed_by_name || 'System'} · {format(new Date(h.created_at + 'Z'), 'PP p')}</div>
                </li>
              ))}
            </ul>
          </div>

          {canManage && (
            <div className="card" style={{ marginTop: 18 }}>
              <h3 style={{ marginTop: 0 }}>Manage Issue</h3>
              {msg && <div className={msg.includes('success') ? 'form-success' : 'form-error'}>{msg}</div>}
              <form onSubmit={submitStatusUpdate}>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign Officer</label>
                  <select className="form-control" value={statusForm.assigned_officer_id} onChange={e => setStatusForm(f => ({ ...f, assigned_officer_id: e.target.value }))}>
                    <option value="">-- Unassigned --</option>
                    {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Internal Note (for timeline)</label>
                  <input className="form-control" value={statusForm.note} onChange={e => setStatusForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. Team dispatched" />
                </div>
                <div className="form-group">
                  <label>Resolution Notes</label>
                  <textarea className="form-control" value={statusForm.resolution_notes} onChange={e => setStatusForm(f => ({ ...f, resolution_notes: e.target.value }))} placeholder="Describe what was done to resolve this issue" />
                </div>
                <div className="form-group">
                  <label>Resolution Photo (optional)</label>
                  <input className="form-control" type="file" accept="image/*" onChange={e => setResolutionPhoto(e.target.files[0])} />
                </div>
                <button className="btn btn-primary btn-block" disabled={busy} type="submit">{busy ? 'Saving...' : 'Update Issue'}</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
