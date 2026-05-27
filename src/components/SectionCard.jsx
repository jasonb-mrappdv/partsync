export default function SectionCard({ title, action, children }) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden" style={{ backgroundColor: '#152A45' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}