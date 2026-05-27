export default function StatCard({ label, value, sub, progress }) {
  return (
    <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: '#1E3A5F' }}>
      <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{sub}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: '#0D1B2A' }}>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: '#3B82F6', width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}