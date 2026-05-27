import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Upload, Search, X, ExternalLink, ChevronDown } from 'lucide-react';

const STATUSES = ['Pending', 'In Transit', 'Shipped', 'Delivered', 'Cancelled'];

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
      <div className="w-full max-w-2xl rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#152A45' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{order ? 'Edit Order' : 'New Part Order'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
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
                <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>{label}</label>
                <input
                  type={type || 'text'}
                  required={required}
                  value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none focus:border-blue-500"
                  style={{ backgroundColor: '#0D1B2A' }}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Vendor</label>
              <select
                value={form.vendor_id || ''}
                onChange={e => handleVendorChange(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none"
                style={{ backgroundColor: '#0D1B2A' }}
              >
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Status</label>
              <select
                value={form.status || 'Pending'}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none"
                style={{ backgroundColor: '#0D1B2A' }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none"
              style={{ backgroundColor: '#0D1B2A' }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm font-medium border border-white/20 text-white hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: '#3B82F6' }}>
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
      <div className="w-full max-w-2xl rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#152A45' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Import Orders from CSV</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            Paste CSV data below. Expected columns: part_number, purchase_order, customer_email, customer_name, part_category, vendor_name
          </p>
          <textarea
            value={csv}
            onChange={e => setCsv(e.target.value)}
            rows={8}
            placeholder="part_number,purchase_order,customer_email,customer_name&#10;ABC123,PO-001,customer@example.com,John Doe"
            className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none font-mono"
            style={{ backgroundColor: '#0D1B2A' }}
          />
          {preview.length > 0 && (
            <p className="text-xs" style={{ color: '#4ade80' }}>✓ {preview.length} rows parsed successfully</p>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={handleParse} className="px-4 py-2 rounded text-sm font-medium border border-white/20 text-white hover:bg-white/5">Preview</button>
            <button onClick={handleImport} disabled={!csv.trim()} className="px-4 py-2 rounded text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#3B82F6' }}>
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Order Status</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Manage and track all part orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border border-white/20 text-white hover:bg-white/5">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => { setEditOrder(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: '#3B82F6' }}>
            <Plus className="w-4 h-4" /> Add Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748b' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search part #, PO, vendor..."
            className="w-full pl-9 pr-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none"
            style={{ backgroundColor: '#152A45' }}
          />
        </div>
        <div className="flex gap-1">
          {['All', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: statusFilter === s ? '#3B82F6' : '#1E3A5F',
                color: statusFilter === s ? '#fff' : '#94a3b8',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      <SectionCard title={`Orders (${filtered.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ backgroundColor: '#0D1B2A' }}>
                {['Part Number', 'PO #', 'Vendor', 'Order #', 'Tracking', 'Est. Delivery', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10" style={{ color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10" style={{ color: '#64748b' }}>No orders found.</td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#3B82F6' }}>{order.part_number}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{order.purchase_order}</td>
                  <td className="px-4 py-3 text-xs text-white">{order.vendor_name || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{order.vendor_order_number || '—'}</td>
                  <td className="px-4 py-3">
                    {order.tracking_number ? (
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#3B82F6' }}>
                        {order.tracking_number}<ExternalLink className="w-3 h-3" />
                      </span>
                    ) : <span className="text-xs" style={{ color: '#475569' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                    {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditOrder(order); setShowModal(true); }} className="text-xs px-2 py-1 rounded border border-white/20 text-white hover:bg-white/10">Edit</button>
                      <button onClick={() => handleDelete(order.id)} className="text-xs px-2 py-1 rounded text-red-400 border border-red-900/50 hover:bg-red-900/20">Del</button>
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