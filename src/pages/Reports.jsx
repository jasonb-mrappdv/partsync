import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import SectionCard from '@/components/SectionCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.PartOrder.list('-created_date', 500),
      base44.entities.ReturnLog.list('-created_date', 200),
    ]).then(([o, r]) => {
      setOrders(o);
      setReturns(r);
      setLoading(false);
    });
  }, []);

  // Status breakdown
  const statusData = ['Pending', 'In Transit', 'Shipped', 'Delivered', 'Cancelled'].map(s => ({
    name: s,
    value: orders.filter(o => o.status === s).length,
  })).filter(d => d.value > 0);

  // Vendor order count
  const vendorMap = {};
  orders.forEach(o => {
    if (o.vendor_name) {
      vendorMap[o.vendor_name] = (vendorMap[o.vendor_name] || 0) + 1;
    }
  });
  const vendorData = Object.entries(vendorMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  // Return issue breakdown
  const issueMap = {};
  returns.forEach(r => {
    issueMap[r.issue_type] = (issueMap[r.issue_type] || 0) + 1;
  });
  const issueData = Object.entries(issueMap).map(([name, value]) => ({ name, value }));

  const tooltipStyle = { backgroundColor: '#152A45', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Analytics and performance overview</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Shipped / Delivered', value: orders.filter(o => o.status === 'Shipped' || o.status === 'Delivered').length },
          { label: 'Total Returns', value: returns.length },
          { label: 'Resolved Returns', value: returns.filter(r => r.log_status === 'Resolved').length },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: '#1E3A5F' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>{s.label}</p>
            <p className="text-3xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order status breakdown */}
        <SectionCard title="Order Status Breakdown">
          <div className="p-4 h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full" style={{ color: '#64748b' }}>Loading...</div>
            ) : statusData.length === 0 ? (
              <div className="flex items-center justify-center h-full" style={{ color: '#64748b' }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#475569' }} style={{ fontSize: 10, fill: '#94a3b8' }}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        {/* Orders by vendor */}
        <SectionCard title="Orders by Vendor">
          <div className="p-4 h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full" style={{ color: '#64748b' }}>Loading...</div>
            ) : vendorData.length === 0 ? (
              <div className="flex items-center justify-center h-full" style={{ color: '#64748b' }}>No vendor data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorData} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        {/* Return issues */}
        <SectionCard title="Return Issues Breakdown">
          <div className="p-4 h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full" style={{ color: '#64748b' }}>Loading...</div>
            ) : issueData.length === 0 ? (
              <div className="flex items-center justify-center h-full" style={{ color: '#64748b' }}>No return data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={issueData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {issueData.map((_, i) => <Cell key={i} fill={[COLORS[3], COLORS[2], COLORS[4]][i % 3]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}