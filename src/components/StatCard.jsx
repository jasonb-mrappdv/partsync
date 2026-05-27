export default function StatCard({ label, value, sub, progress }) {
  return (
    <div className="rounded-lg p-4 border border-border bg-card">
      <p className="text-xs font-medium mb-1 text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs mt-1 text-muted-foreground">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-background">
          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}