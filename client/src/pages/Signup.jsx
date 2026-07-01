import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', ward: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(form);
      navigate('/issues');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2>Create Your Account</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: -8, fontSize: '0.88rem' }}>Sign up as a citizen to start reporting issues in your town.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" required value={form.name} onChange={update('name')} placeholder="Jane Doe" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone (optional)</label>
              <input className="form-control" value={form.phone} onChange={update('phone')} placeholder="+91 98xxxxxx" />
            </div>
            <div className="form-group">
              <label>Ward / Area (optional)</label>
              <input className="form-control" value={form.ward} onChange={update('ward')} placeholder="Ward 3" />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" required minLength={6} value={form.password} onChange={update('password')} placeholder="At least 6 characters" />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy} type="submit">{busy ? 'Creating account...' : 'Sign Up'}</button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
