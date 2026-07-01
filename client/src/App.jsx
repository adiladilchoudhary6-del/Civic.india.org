import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ReportIssue from './pages/ReportIssue';
import IssuesFeed from './pages/IssuesFeed';
import IssueDetail from './pages/IssueDetail';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <span>© {new Date().getFullYear()} CivicConnect — Built for a better town.</span>
        <span>A citizen-government issue resolution platform.</span>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <div className="app-main">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/issues" element={<IssuesFeed />} />
              <Route path="/issues/:id" element={<IssueDetail />} />
              <Route path="/report" element={
                <ProtectedRoute roles={['citizen']}><ReportIssue /></ProtectedRoute>
              } />
              <Route path="/my-issues" element={
                <ProtectedRoute roles={['citizen']}><IssuesFeed mine title="My Reports" subtitle="Track the issues you've reported." /></ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute roles={['officer', 'admin']}><Dashboard /></ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>
              } />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
