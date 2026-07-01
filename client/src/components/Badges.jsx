export function StatusBadge({ status }) {
  const labels = {
    pending: 'Pending',
    acknowledged: 'Acknowledged',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected'
  };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority}`}>{priority}</span>;
}
