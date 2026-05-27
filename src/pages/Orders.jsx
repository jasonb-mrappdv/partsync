import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Upload, Search, X, ExternalLink, Ban, AlertCircle } from 'lucide-react';

const STATUSES = ['Pending', 'In Transit', 'Shipped', 'Delivered', 'Cancelled', 'Back Ordered'];

function OrderModal({ order, vendors, onClose, onSave }) {
  const [form, setForm] = useState(order || {
    part_number: '', purchase_order: '', vendor_id: '', vendor_name: '',
    vendor_order_number: '', tracking_number: '', estimated_delivery: '',
    customer_email: '', customer_name: '', status: 'Pending', notes: '', part_category: ''
  });

  const handleVendorChange = (id) => {
    const v = vendors.find(v => v.id === id);
    setForm(f => ({ ...f, vendor_id: id, vendor_name: v?.name || '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-xl border border-border overflow-hidden bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">{order ? 'Edit Order' : 'New Part Order'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Part Number *', key: 'part_number', required: true },
              { label: 'Purchase Order *', key: 'purchase_order', required: true },
              { label: 'Customer Name', key: 'customer_name' },
              { label: 'Customer Email', key: 'customer_email', type: 'email' },
              { label: 'Part Category', key: 'part_category' },
              { label: 'Vendor Order #', key: 'vendor_order_number' },
              { label: 'Tracking Number', key: 'tracking_number' },
              { label: 'Est. Delivery', key: 'estimated_delivery', type: 'date' },
            ].map(({ label, key, required, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">{label}</label>
                <input
                  type={type || 'text'}
                  required={required}
                  value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none focus:border-primary bg-background"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Vendor</label>
              <select
                value={form.vendor_id || ''}
                onChange={e => handleVendorChange(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background"
              >
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Status</label>
              <select
                value={form.status || 'Pending'}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background"
            />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-900/40 bg-yellow-900/10">
            <input type="checkbox" id="is_backordered" checked={!!form.is_backordered}
              onChange={e => setForm(f => ({ ...f, is_backordered: e.target.checked }))}
              className="w-4 h-4 accent-yellow-500" />
            <label htmlFor="is_backordered" className="text-sm text-yellow-300 font-medium cursor-pointer">Mark as Back Ordered</label>
          </div>
          {form.is_backordered && (
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Est. Availability Date</label>
              <input type="date" value={form.backorder_availability_date || ''}
                onChange={e => setForm(f => ({ ...f, backorder_availability_date: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm font-medium border border-border text-white hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded text-sm font-semibold text-white bg-primary">
              {order ? 'Save Changes' : 'Add Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CsvImportModal({ vendors, onClose, onImport }) {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState([]);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g, '_'));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    });
  };

  const handleParse = () => {
    setPreview(parseCSV(csv));
  };

  const handleImport = () => {
    const rows = parseCSV(csv).map(row => ({
      part_number: row.part_number || row.part || '',
      purchase_order: row.purchase_order || row.po || row.po_number || '',
      customer_email: row.customer_email || row.email || '',
      customer_name: row.customer_name || row.customer || '',
      part_category: row.part_category || row.category || '',
      vendor_name: row.vendor_name || row.vendor || '',
      status: 'Pending',
    }));
    onImport(rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-xl border border-border overflow-hidden bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Import Orders from CSV</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-muted-foreground">
            Paste CSV data below. Expected columns: part_number, purchase_order, customer_email, customer_name, part_category, vendor_name
          </p>
          <textarea
            value={csv}
            onChange={e => setCsv(e.target.value)}
            rows={8}
            placeholder="part_number,purchase_order,customer_email,customer_name&#10;ABC123,PO-001,customer@example.com,John Doe"
            className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none font-mono bg-background"
          />
          {preview.length > 0 && (
            <p className="text-xs text-green-400">✓ {preview.length} rows parsed successfully</p>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={handleParse} className="px-4 py-2 rounded text-sm font-medium border border-border text-white hover:bg-white/5">Preview</button>
            <button onClick={handleImport} disabled={!csv.trim()} className="px-4 py-2 rounded text-sm font-semibold text-white disabled:opacity-50 bg-primary">
              Import Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editOrder, setEditOrder] = useState(null);

  const fetchOrders = async () => {
    const [o, v] = await Promise.all([
      base44.entities.PartOrder.list('-created_date', 200),
      base44.entities.Vendor.list(),
    ]);
    setOrders(o);
    setVendors(v);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.part_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.purchase_order?.toLowerCase().includes(search.toLowerCase()) ||
      o.vendor_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (form) => {
    if (editOrder) {
      await base44.entities.PartOrder.update(editOrder.id, form);
    } else {
      await base44.entities.PartOrder.create(form);
    }
    setShowModal(false);
    setEditOrder(null);
    fetchOrders();
  };

  const handleImport = async (rows) => {
    await base44.entities.PartOrder.bulkCreate(rows);
    setShowImport(false);
    fetchOrders();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this order?')) return;
    await base44.entities.PartOrder.delete(id);
    fetchOrders();
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    await base44.entities.PartOrder.update(id, { status: 'Cancelled' });
    fetchOrders();
  };

  const handleCancelBackorder = async (id) => {
    if (!confirm('Cancel this back ordered part?')) return;
    await base44.entities.PartOrder.update(id, { status: 'Cancelled', is_backordered: false });
    fetchOrders();
  };

  const backOrdered = orders.filter(o => o.is_backordered && o.status !== 'Cancelled');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Order Status</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">Manage and track all part orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border border-white/20 text-white hover:bg-white/5">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => { setEditOrder(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white bg-primary">
            <Plus className="w-4 h-4" /> Add Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search part #, PO, vendor..."
            className="w-full pl-9 pr-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-secondary"
          />
        </div>
        <div className="flex gap-1">
          {['All', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: statusFilter === s ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                color: statusFilter === s ? '#fff' : 'hsl(var(--muted-foreground))',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      <SectionCard title={`Orders (${filtered.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {['Part Number', 'PO #', 'Vendor', 'Order #', 'Tracking', 'Est. Delivery', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No orders found.</td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{order.part_number}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.purchase_order}</td>
                  <td className="px-4 py-3 text-xs text-white">{order.vendor_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.vendor_order_number || '—'}</td>
                  <td className="px-4 py-3">
                    {order.tracking_number ? (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        {order.tracking_number}<ExternalLink className="w-3 h-3" />
                      </span>
                    ) : <span className="text-xs text-muted-foreground/60">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3">
                   <div className="flex gap-2">
                     <button onClick={() => { setEditOrder(order); setShowModal(true); }} className="text-xs px-2 py-1 rounded border border-white/20 text-white hover:bg-white/10">Edit</button>
                     {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                       <button onClick={() => handleCancel(order.id)} className="text-xs px-2 py-1 rounded text-orange-400 border border-orange-900/50 hover:bg-orange-900/20 flex items-center gap-1">
                         <Ban className="w-3 h-3" /> Cancel
                       </button>
                     )}
                     <button onClick={() => handleDelete(order.id)} className="text-xs px-2 py-1 rounded text-red-400 border border-red-900/50 hover:bg-red-900/20">Del</button>
                   </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Back Ordered Parts */}
      <SectionCard title={
        <span className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          Back Ordered Parts ({backOrdered.length})
        </span>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {['Part Number', 'PO #', 'Vendor', 'Customer', 'Est. Availability', 'Notes', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {backOrdered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No back ordered parts.</td></tr>
              ) : backOrdered.map(order => (
                <tr key={order.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{order.part_number}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.purchase_order}</td>
                  <td className="px-4 py-3 text-xs text-white">{order.vendor_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-white">{order.customer_name || order.customer_email || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {order.backorder_availability_date
                      ? <span className="text-yellow-400 font-medium">{new Date(order.backorder_availability_date).toLocaleDateString()}</span>
                      : <span className="text-muted-foreground/60">Not set</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{order.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditOrder(order); setShowModal(true); }} className="text-xs px-2 py-1 rounded border border-white/20 text-white hover:bg-white/10">Edit</button>
                      <button onClick={() => handleCancelBackorder(order.id)} className="text-xs px-2 py-1 rounded text-orange-400 border border-orange-900/50 hover:bg-orange-900/20 flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {showModal && <OrderModal order={editOrder} vendors={vendors} onClose={() => { setShowModal(false); setEditOrder(null); }} onSave={handleSave} />}
      {showImport && <CsvImportModal vendors={vendors} onClose={() => setShowImport(false)} onImport={handleImport} />}
    </div>
  );
}