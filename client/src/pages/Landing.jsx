import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

export default function Landing() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/issues').then(res => {
      const issues = res.data.issues;
      const resolved = issues.filter(i => i.status === 'resolved').length;
      setStats({ total: issues.length, resolved });
    }).catch(() => {});
  }, []);

  const steps = [
    { num: 1, title: 'Report an Issue', desc: 'Snap a photo, pin the location, and describe the civic problem in your town.' },
    { num: 2, title: 'Auto-Routed to Department', desc: 'Your report is instantly sent to the right government department for action.' },
    { num: 3, title: 'Track Progress', desc: 'Follow status updates in real time — from Pending to Resolved.' },
    { num: 4, title: 'Community Impact', desc: 'Upvote issues that matter most so authorities can prioritize what affects the most people.' }
  ];

  const categories = [
    { icon: '🛣️', name: 'Roads & Potholes' },
    { icon: '💧', name: 'Water Supply' },
    { icon: '🗑️', name: 'Garbage & Sanitation' },
    { icon: '💡', name: 'Streetlights & Power' },
    { icon: '🚧', name: 'Public Safety' },
    { icon: '🌳', name: 'Parks & Environment' }
  ];

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>Report It. Track It. Get It Fixed.</h1>
          <p>
            CivicConnect is a platform that lets citizens highlight local problems directly to
            the government, and lets officials track and resolve them transparently — together,
            we build a better town.
          </p>
          <div className="hero-actions">
            <Link to="/signup"><button className="btn btn-accent">Report an Issue</button></Link>
            <Link to="/issues"><button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>Browse Community Issues</button></Link>
          </div>
          {stats && (
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="num">{stats.total}</div>
                <div className="label">Issues Reported</div>
              </div>
              <div className="hero-stat">
                <div className="num">{stats.resolved}</div>
                <div className="label">Resolved</div>
              </div>
              <div className="hero-stat">
                <div className="num">6</div>
                <div className="label">Departments Involved</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>How It Works</h2>
          <p className="subtitle">A simple, transparent process from problem to resolution.</p>
          <div className="grid grid-4">
            {steps.map(s => (
              <div className="card step-card" key={s.num}>
                <div className="step-num">{s.num}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <h2>What You Can Report</h2>
          <p className="subtitle">Every issue is routed to the right municipal department automatically.</p>
          <div className="grid grid-3">
            {categories.map(c => (
              <div className="card" key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: '1.8rem' }}>{c.icon}</div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to make a difference in your town?</h2>
          <p className="subtitle">Join citizens and officials working together to fix what matters.</p>
          <Link to="/signup"><button className="btn btn-primary">Get Started — It's Free</button></Link>
        </div>
      </section>
    </div>
  );
}
