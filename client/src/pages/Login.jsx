import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      const redirect = location.state?.from;
      if (redirect) navigate(redirect);
      else if (user.role === 'admin' || user.role === 'officer') navigate('/dashboard');
      else navigate('/issues');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const quickFill = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2>Welcome Back</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: -8, fontSize: '0.88rem' }}>Log in to report or manage civic issues.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy} type="submit">{busy ? 'Logging in...' : 'Log In'}</button>
        </form>
        <div className="auth-switch">
          New here? <Link to="/signup">Create a citizen account</Link>
        </div>
        <div className="demo-creds">
          <b>Demo accounts</b> (click to autofill):<br/>
          <a href="#" onClick={(e) => { e.preventDefault(); quickFill('admin@civicconnect.gov', 'Admin@123'); }}>Admin: admin@civicconnect.gov / Admin@123</a><br/>
          <a href="#" onClick={(e) => { e.preventDefault(); quickFill('roads.officer@civicconnect.gov', 'Officer@123'); }}>Officer: roads.officer@civicconnect.gov / Officer@123</a><br/>
          <a href="#" onClick={(e) => { e.preventDefault(); quickFill('ravi@example.com', 'Citizen@123'); }}>Citizen: ravi@example.com / Citizen@123</a>
        </div>
      </div>
    </div>
  );
}
