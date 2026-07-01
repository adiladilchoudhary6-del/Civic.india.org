import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="navbar">
      <NavLink to="/" className="navbar-brand">
        <span className="logo-badge">CC</span>
        CivicConnect
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/issues" className={({isActive}) => isActive ? 'active' : ''}>Browse Issues</NavLink>
        {user && user.role === 'citizen' && (
          <NavLink to="/report" className={({isActive}) => isActive ? 'active' : ''}>Report Issue</NavLink>
        )}
        {user && user.role === 'citizen' && (
          <NavLink to="/my-issues" className={({isActive}) => isActive ? 'active' : ''}>My Reports</NavLink>
        )}
        {user && (user.role === 'officer' || user.role === 'admin') && (
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>Dashboard</NavLink>
        )}
        {user && user.role === 'admin' && (
          <NavLink to="/admin/users" className={({isActive}) => isActive ? 'active' : ''}>Manage Users</NavLink>
        )}
      </div>
      <div className="navbar-user">
        {!user && (
          <>
            <NavLink to="/login" className="nav-link">Log In</NavLink>
            <NavLink to="/signup"><button className="btn btn-accent btn-sm">Sign Up</button></NavLink>
          </>
        )}
        {user && (
          <>
            <span className="role-pill">{user.role}</span>
            <span style={{ fontSize: '0.85rem' }}>{user.name}</span>
            <button className="btn btn-outline btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={handleLogout}>Log Out</button>
          </>
        )}
      </div>
    </div>
  );
}
