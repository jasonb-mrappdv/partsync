import { useState, useMemo } from 'react';
import SectionCard from '@/components/SectionCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2];

function getQuarter(dateStr) {
  const month = new Date(dateStr).getMonth(); // 0-indexed
  return Math.floor(month / 3) + 1;
}

function getYear(dateStr) {
  return new Date(dateStr).getFullYear();
}

export default function TechnicianQuarterlyLog({ returns }) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(QUARTERS[Math.floor(new Date().getMonth() / 3)]);

  const qNum = QUARTERS.indexOf(selectedQuarter) + 1;

  // Aggregate returns by technician (reported_by) for selected quarter/year
  const techMap = useMemo(() => {
    const map = {};
    returns.forEach(r => {
      if (!r.created_date) return;
      const y = getYear(r.created_date);
      const q = getQuarter(r.created_date);
      if (y !== selectedYear || q !== qNum) return;
      const key = r.reported_by || r.created_by || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [returns, selectedYear, qNum]);

  const chartData = Object.entries(techMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const total = chartData.reduce((sum, t) => sum + t.count, 0);

  const tooltipStyle = {
    backgroundColor: 'hsl(210 28% 15%)',
    border: '1px solid hsl(210 24% 24%)',
    color: '#fff',
    fontSize: 12,
  };

  return (
    <SectionCard title="Quarterly Technician Return Log">
      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Year:</span>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="appearance-none text-xs px-3 py-1.5 pr-7 rounded border border-border bg-background text-white focus:outline-none"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex gap-1">
            {QUARTERS.map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: selectedQuarter === q ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                  color: selectedQuarter === q ? '#fff' : 'hsl(var(--muted-foreground))',
                }}
              >{q}</button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {total} total return{total !== 1 ? 's' : ''} · {selectedQuarter} {selectedYear}
          </span>
        </div>

        {/* Chart */}
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            No returns logged for {selectedQuarter} {selectedYear}
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" name="Returns" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        {chartData.length > 0 && (
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Technician</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Returns</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((t, i) => (
                  <tr key={t.name} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 text-white text-xs">{t.name}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-primary">{t.count}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {total > 0 ? ((t.count / total) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionCard>
  );
}