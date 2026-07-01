import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CATEGORY_MAP = {
  'Pothole': 'Roads & Infrastructure',
  'Road Damage': 'Roads & Infrastructure',
  'Broken Footpath': 'Roads & Infrastructure',
  'Water Leak': 'Water Supply',
  'Water Shortage': 'Water Supply',
  'Water Contamination': 'Water Supply',
  'Garbage Collection': 'Sanitation & Waste',
  'Illegal Dumping': 'Sanitation & Waste',
  'Drainage': 'Sanitation & Waste',
  'Sewage Overflow': 'Sanitation & Waste',
  'Streetlight': 'Electricity & Streetlights',
  'Power Outage': 'Electricity & Streetlights',
  'Exposed Wiring': 'Electricity & Streetlights',
  'Encroachment': 'Public Safety',
  'Illegal Construction': 'Public Safety',
  'Safety Hazard': 'Public Safety',
  'Park Maintenance': 'Parks & Environment',
  'Tree/Greenery': 'Parks & Environment',
  'Pollution': 'Parks & Environment',
  'Other': null
};

export default function ReportIssue() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'medium',
    address: '', ward: '', latitude: '', longitude: ''
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    api.get('/departments').then(res => setDepartments(res.data.departments));
  }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.title || !form.description || !form.category) {
      setError('Please fill title, description, and category.');
      return;
    }
    setBusy(true);
    try {
      const deptName = CATEGORY_MAP[form.category];
      const dept = departments.find(d => d.name === deptName);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (dept) fd.append('department_id', dept.id);
      if (photo) fd.append('photo', photo);

      const res = await api.post('/issues', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Issue reported successfully! Redirecting...');
      setTimeout(() => navigate(`/issues/${res.data.issue.id}`), 900);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit issue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1>Report a Civic Issue</h1>
        <p>Give as much detail as possible so the right department can act quickly.</p>
      </div>
      <div className="card">
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Issue Title</label>
            <input className="form-control" required value={form.title} onChange={update('title')} placeholder="e.g. Deep pothole near bus stop" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" required value={form.category} onChange={update('category')}>
                <option value="">Select a category</option>
                {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority} onChange={update('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" required value={form.description} onChange={update('description')} placeholder="Describe the issue in detail: what, where, since when, and its impact." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Address / Landmark</label>
              <input className="form-control" value={form.address} onChange={update('address')} placeholder="Street, landmark" />
            </div>
            <div className="form-group">
              <label>Ward / Area</label>
              <input className="form-control" value={form.ward} onChange={update('ward')} placeholder="e.g. Ward 3" />
            </div>
          </div>
          <div className="form-group">
            <label>Location Coordinates (optional but recommended)</label>
            <div className="form-row">
              <input className="form-control" value={form.latitude} onChange={update('latitude')} placeholder="Latitude" />
              <input className="form-control" value={form.longitude} onChange={update('longitude')} placeholder="Longitude" />
              <button type="button" className="btn btn-outline" onClick={useMyLocation} disabled={locating}>
                {locating ? 'Locating...' : '📍 Use My Location'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Photo Evidence</label>
            <input className="form-control" type="file" accept="image/*" onChange={handlePhoto} />
            {preview && <img src={preview} alt="preview" style={{ marginTop: 10, maxHeight: 180, borderRadius: 8 }} />}
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
