import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { Package, X, CheckCircle, Clock, Truck, Eye } from 'lucide-react';

const VENDOR_STATUSES = ['Pending', 'In Transit', 'Shipped', 'Delivered'];

function UpdateOrderModal({ order, onClose, onSave }) {
  const [form, setForm] = useState({
    vendor_order_number: order.vendor_order_number || '',
    tracking_number: order.tracking_number || '',
    estimated_delivery: order.estimated_delivery || '',
    status: order.status || 'Pending',
    notes: order.notes || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-xl border border-border overflow-hidden bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-white">Update Order</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Part: <span className="text-primary font-mono">{order.part_number}</span> · PO: {order.purchase_order}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(order.id, form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Your Order # (Vendor)</label>
              <input value={form.vendor_order_number} onChange={e => setForm(f => ({ ...f, vendor_order_number: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Tracking Number</label>
              <input value={form.tracking_number} onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Estimated Delivery</label>
              <input type="date" value={form.estimated_delivery} onChange={e => setForm(f => ({ ...f, estimated_delivery: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Order Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background">
                {VENDOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none resize-none bg-background" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm font-medium border border-border text-white hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded text-sm font-semibold text-white bg-primary">Save Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VendorPortal() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [allVendors, setAllVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOrder, setEditOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [adminPreviewId, setAdminPreviewId] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchData = async (u, previewVendorId = null) => {
    const vendors = await base44.entities.Vendor.list();
    setAllVendors(vendors);

    const isAdminUser = u?.role === 'admin';
    const myVendor = previewVendorId
      ? vendors.find(v => v.id === previewVendorId)
      : isAdminUser
        ? null
        : vendors.find(v => v.email?.toLowerCase() === u.email?.toLowerCase());
    setVendor(myVendor);

    if (myVendor) {
      const allOrders = await base44.entities.PartOrder.list('-created_date', 200);
      setOrders(allOrders.filter(o => o.vendor_id === myVendor.id));
    } else {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      fetchData(u);
    });
  }, []);

  const handleAdminPreview = (vendorId) => {
    setAdminPreviewId(vendorId);
    setStatusFilter('All');
    setLoading(true);
    fetchData(user, vendorId || null);
  };

  const handleSave = async (id, form) => {
    await base44.entities.PartOrder.update(id, form);
    setEditOrder(null);
    fetchData(user, adminPreviewId || null);
  };

  const filtered = orders.filter(o => statusFilter === 'All' || o.status === statusFilter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    inTransit: orders.filter(o => o.status === 'In Transit' || o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">Loading your orders...</div>
  );

  if (!vendor && !isAdmin) return (
    <div className="max-w-lg mx-auto mt-20 text-center space-y-3">
      <Package className="w-12 h-12 mx-auto text-muted-foreground" />
      <h2 className="text-xl font-bold text-white">No Vendor Profile Found</h2>
      <p className="text-muted-foreground text-sm">Your account email (<span className="text-primary">{user?.email}</span>) is not linked to a vendor. Please contact the administrator.</p>
    </div>
  );

  if (!vendor && isAdmin) return (
    <div className="max-w-lg mx-auto mt-20 text-center space-y-3">
      <Eye className="w-12 h-12 mx-auto text-muted-foreground" />
      <h2 className="text-xl font-bold text-white">Admin Preview Mode</h2>
      <p className="text-muted-foreground text-sm mb-4">Select a vendor to preview their portal.</p>
      <select
        value={adminPreviewId}
        onChange={e => handleAdminPreview(e.target.value)}
        className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-secondary"
      >
        <option value="">Select a vendor...</option>
        {allVendors.map(v => <option key={v.id} value={v.id}>{v.name} — {v.email}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {isAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/30 bg-primary/10">
          <Eye className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm text-primary font-medium">Admin Preview:</span>
          <select
            value={adminPreviewId}
            onChange={e => handleAdminPreview(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded text-sm text-white border border-border focus:outline-none bg-background max-w-xs"
          >
            <option value="">Select a vendor...</option>
            {allVendors.map(v => <option key={v.id} value={v.id}>{v.name} — {v.email}</option>)}
          </select>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{vendor.name} — Vendor Portal</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">Orders assigned to your company</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: Package },
          { label: 'Pending', value: stats.pending, icon: Clock },
          { label: 'In Transit / Shipped', value: stats.inTransit, icon: Truck },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg p-4 border border-border bg-card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['All', ...VENDOR_STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: statusFilter === s ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
              color: statusFilter === s ? '#fff' : 'hsl(var(--muted-foreground))',
            }}>{s}</button>
        ))}
      </div>

      <SectionCard title={`Assigned Orders (${filtered.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {['Part Number', 'PO #', 'Customer', 'Your Order #', 'Tracking', 'Est. Delivery', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No orders in this status.</td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{order.part_number}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.purchase_order}</td>
                  <td className="px-4 py-3 text-xs text-white">{order.customer_name || order.customer_email || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.vendor_order_number || <span className="text-yellow-500/70">Not set</span>}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.tracking_number || <span className="text-yellow-500/70">Not set</span>}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditOrder(order)}
                      className="text-xs px-3 py-1 rounded bg-primary text-white font-medium hover:opacity-90">
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {editOrder && <UpdateOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSave={handleSave} />}
    </div>
  );
}