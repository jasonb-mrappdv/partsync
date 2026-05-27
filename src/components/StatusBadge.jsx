export default function StatusBadge({ status }) {
  const configs = {
    Shipped:          { bg: '#14532d', text: '#4ade80', label: 'Shipped' },
    Pending:          { bg: '#7c2d12', text: '#fb923c', label: 'Pending' },
    'In Transit':     { bg: '#1e3a5f', text: '#60a5fa', label: 'In Transit' },
    Delivered:        { bg: '#14532d', text: '#4ade80', label: 'Delivered' },
    Cancelled:        { bg: '#3b1e1e', text: '#f87171', label: 'Cancelled' },
    Reported:         { bg: '#7c1d1d', text: '#fca5a5', label: 'Reported' },
    'Under Review':   { bg: '#78350f', text: '#fcd34d', label: 'Under Review' },
    Resolved:         { bg: '#14532d', text: '#4ade80', label: 'Resolved' },
  };

  const cfg = configs[status] || { bg: '#1e293b', text: '#94a3b8', label: status };

  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}