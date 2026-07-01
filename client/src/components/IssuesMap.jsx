import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon paths (Vite bundling issue with leaflet assets)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const priorityColors = { low: '#64748b', medium: '#d97706', high: '#ea580c', critical: '#dc2626' };

export default function IssuesMap({ issues }) {
  const geoIssues = issues.filter(i => i.latitude && i.longitude);
  const center = geoIssues.length
    ? [geoIssues[0].latitude, geoIssues[0].longitude]
    : [19.0760, 72.8777]; // default fallback center

  return (
    <div className="leaflet-map">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoIssues.map(issue => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{issue.title}</div>
                <div style={{ fontSize: '0.8rem', color: priorityColors[issue.priority], fontWeight: 700, textTransform: 'uppercase' }}>{issue.priority} priority</div>
                <div style={{ fontSize: '0.8rem', margin: '4px 0' }}>Status: {issue.status.replace('_', ' ')}</div>
                <Link to={`/issues/${issue.id}`} style={{ color: '#1d4ed8', fontWeight: 600, fontSize: '0.85rem' }}>View details →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {geoIssues.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No geo-tagged issues to display on the map yet.</div>
      )}
    </div>
  );
}
