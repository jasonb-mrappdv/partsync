import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { Camera, X, AlertTriangle, Package, RotateCcw, CheckCircle } from 'lucide-react';

const ISSUE_TYPES = ['Damaged in Transit', 'Wrong Item', 'Defective'];

function ReturnModal({ order, onClose, onSave, user }) {
  const [form, setForm] = useState({
    part_number: order?.part_number || '',
    purchase_order: order?.purchase_order || '',
    vendor_id: order?.vendor_id || '',
    vendor_name: order?.vendor_name || '',
    order_id: order?.id || '',
    issue_type: 'Damaged in Transit',
    description: '',
    photo_url: '',
    log_status: 'Reported',
    reported_by: user?.full_name || user?.email || '',
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-xl border border-border overflow-hidden bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-white">Log Return / Issue</h3>
            {order && <p className="text-xs text-muted-foreground mt-0.5">Part: <span className="text-primary font-mono">{order.part_number}</span></p>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          {/* Photo */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">Part Photo</label>
            <div onClick={() => fileRef.current?.click()}
              className="w-full h-32 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-background">
              {form.photo_url ? (
                <img src={form.photo_url} alt="part" className="w-full h-full object-cover" />
              ) : uploading ? (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              ) : (
                <>
                  <Camera className="w-7 h-7 mb-1.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Click to upload photo</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Part Number *</label>
              <input required value={form.part_number} onChange={e => setForm(f => ({ ...f, part_number: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Purchase Order</label>
              <input value={form.purchase_order} onChange={e => setForm(f => ({ ...f, purchase_order: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Issue Type *</label>
              <select required value={form.issue_type} onChange={e => setForm(f => ({ ...f, issue_type: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background">
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              placeholder="Describe the issue..."
              className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none resize-none bg-background" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm font-medium border border-border text-white hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded text-sm font-semibold text-white bg-primary">Submit Return</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TechnicianPortal() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [myReturns, setMyReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnModal, setReturnModal] = useState(null); // order or true for blank
  const [activeTab, setActiveTab] = useState('orders');

  const fetchData = async (u) => {
    const [allOrders, allReturns] = await Promise.all([
      base44.entities.PartOrder.list('-created_date', 200),
      base44.entities.ReturnLog.list('-created_date', 100),
    ]);
    // Show orders assigned to this technician's customer email, or all active orders if no filter
    const userEmail = u?.email?.toLowerCase();
    const relevantOrders = allOrders.filter(o =>
      o.status !== 'Cancelled' &&
      (o.customer_email?.toLowerCase() === userEmail || o.created_by?.toLowerCase() === userEmail)
    );
    // Fall back to showing all non-cancelled orders if none match
    setOrders(relevantOrders.length > 0 ? relevantOrders : allOrders.filter(o => o.status !== 'Cancelled'));
    setMyReturns(allReturns.filter(r =>
      r.reported_by === u?.full_name || r.created_by?.toLowerCase() === userEmail
    ));
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      fetchData(u);
    });
  }, []);

  const handleReturnSave = async (form) => {
    await base44.entities.ReturnLog.create(form);
    setReturnModal(null);
    fetchData(user);
  };

  const stats = {
    active: orders.filter(o => o.status !== 'Delivered').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    returns: myReturns.length,
    pending: myReturns.filter(r => r.log_status !== 'Resolved').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">Loading your portal...</div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Technician Portal</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">Welcome back, <span className="text-white">{user?.full_name || user?.email}</span></p>
        </div>
        <button onClick={() => setReturnModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white bg-primary">
          <AlertTriangle className="w-4 h-4" /> Report Issue
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Orders', value: stats.active, icon: Package },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle },
          { label: 'My Returns', value: stats.returns, icon: RotateCcw },
          { label: 'Pending Resolution', value: stats.pending, icon: AlertTriangle },
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[{ key: 'orders', label: 'Orders' }, { key: 'returns', label: 'My Returns' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="px-5 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: activeTab === t.key ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              borderBottom: activeTab === t.key ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <SectionCard title={`Orders (${orders.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  {['Part Number', 'PO #', 'Vendor', 'Tracking', 'Est. Delivery', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No active orders found.</td></tr>
                ) : orders.map(order => (
                  <tr key={order.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{order.part_number}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{order.purchase_order}</td>
                    <td className="px-4 py-3 text-xs text-white">{order.vendor_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{order.tracking_number || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setReturnModal(order)}
                        className="text-xs px-2 py-1 rounded border border-red-900/50 text-red-400 hover:bg-red-900/20">
                        Report Issue
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {activeTab === 'returns' && (
        <SectionCard title={`My Return Logs (${myReturns.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  {['Photo', 'Part #', 'PO #', 'Issue Type', 'Description', 'Date', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myReturns.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No return logs yet.</td></tr>
                ) : myReturns.map(ret => (
                  <tr key={ret.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      {ret.photo_url ? (
                        <img src={ret.photo_url} alt="part" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 rounded flex items-center justify-center text-xs bg-secondary text-muted-foreground">No img</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{ret.part_number}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ret.purchase_order || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={ret.issue_type} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{ret.description || '—'}</td>
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
      )}

      {returnModal && (
        <ReturnModal
          order={returnModal === true ? null : returnModal}
          user={user}
          onClose={() => setReturnModal(null)}
          onSave={handleReturnSave}
        />
      )}
    </div>
  );
}