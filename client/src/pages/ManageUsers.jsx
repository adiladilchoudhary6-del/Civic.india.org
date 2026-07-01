import { useEffect, useState } from 'react';
import api from '../api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'officer', department_id: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/users').then(res => setUsers(res.data.users));
  useEffect(() => { load(); api.get('/departments').then(res => setDepartments(res.data.departments)); }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const createUser = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'officer', department_id: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  const deptName = (id) => departments.find(d => d.id === id)?.name || '—';

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Manage Users</h1>
          <p>Create and manage citizen, officer, and admin accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Officer / Admin</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Ward</th><th></th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{u.role}</span></td>
                  <td>{u.department_id ? deptName(u.department_id) : '—'}</td>
                  <td>{u.ward || '—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Add Officer / Admin</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={createUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" required value={form.name} onChange={update('name')} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" required value={form.email} onChange={update('email')} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-control" type="password" required minLength={6} value={form.password} onChange={update('password')} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-control" value={form.role} onChange={update('role')}>
                  <option value="officer">Department Officer</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>
              {form.role === 'officer' && (
                <div className="form-group">
                  <label>Department</label>
                  <select className="form-control" required value={form.department_id} onChange={update('department_id')}>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
