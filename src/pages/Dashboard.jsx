import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/StatCard';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.PartOrder.list('-created_date', 50),
      base44.entities.ReturnLog.list('-created_date', 10),
      base44.entities.Vendor.list('-created_date', 10),
    ]).then(([o, r, v]) => {
      setOrders(o);
      setReturns(r);
      setVendors(v);
      setLoading(false);
    });
  }, []);

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const pendingReturns = returns.filter(r => r.log_status !== 'Resolved');
  const awaitingTracking = orders.filter(o => !o.tracking_number && o.status !== 'Cancelled' && o.status !== 'Delivered');
  const shipped = orders.filter(o => o.status === 'Shipped' || o.status === 'Delivered');
  const fulfilledRate = orders.length > 0 ? Math.round((shipped.length / orders.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm mt-0.5" className="text-muted-foreground">Real-time vendor parts fulfillment status</p>
        </div>
        <Link to="/orders">
          <button className="px-4 py-2 rounded text-sm font-semibold text-white transition-colors hover:opacity-90 bg-primary">
            Canvass Orders
          </button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Active Orders" value={activeOrders.length.toLocaleString()} />
        <StatCard label="Pending Returns" value={pendingReturns.length} />
        <StatCard label="Awaiting Tracking" value={awaitingTracking.length} />
        <StatCard label="Weekly Fulfilled Rate" value={`${fulfilledRate}%`} progress={fulfilledRate} />
        <StatCard label="Total Orders" value={orders.length.toLocaleString()} />
        <StatCard label="Return Logs" value={returns.length} />
        <StatCard label="Active Vendors" value={vendors.filter(v => v.is_active).length} />
      </div>

      {/* Active Orders Table */}
      <SectionCard title="Active Orders Table" action={
        <Link to="/orders">
          <button className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-primary">
            View All Orders
          </button>
        </Link>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ backgroundColor: '#0D1B2A' }}>
                {['Part Number', 'PO #', 'Vendor', 'Order #', 'Tracking', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" className="text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading orders...</td></tr>
              ) : activeOrders.slice(0, 10).length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No active orders. Import orders to get started.</td></tr>
              ) : activeOrders.slice(0, 10).map(order => (
                <tr key={order.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{order.part_number}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.purchase_order}</td>
                  <td className="px-4 py-3 text-xs text-white">{order.vendor_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.vendor_order_number || '—'}</td>
                  <td className="px-4 py-3">
                    {order.tracking_number ? (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        {order.tracking_number} <ExternalLink className="w-3 h-3" />
                      </span>
                    ) : <span className="text-xs text-muted-foreground/60">Pending</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Damaged & Return Log */}
      <SectionCard title="Damaged & Return Log" action={
        <Link to="/returns">
          <button className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-secondary border border-primary/50">
            Detail of Returns
          </button>
        </Link>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {['Photo', 'Part #', 'Issue Type', 'Report Date', 'Log Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : returns.slice(0, 5).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No return logs yet.</td></tr>
              ) : returns.slice(0, 5).map(ret => (
                <tr key={ret.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    {ret.photo_url ? (
                      <img src={ret.photo_url} alt="part" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 rounded flex items-center justify-center text-xs bg-secondary text-muted-foreground">No img</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{ret.part_number}</td>
                  <td className="px-4 py-3"><StatusBadge status={ret.issue_type} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {ret.created_date ? new Date(ret.created_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={ret.log_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}