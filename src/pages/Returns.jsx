import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Camera, X, Upload } from 'lucide-react';

const ISSUE_TYPES = ['Damaged in Transit', 'Wrong Item', 'Defective'];
const LOG_STATUSES = ['Reported', 'Under Review', 'Resolved'];

function ReturnModal({ onClose, onSave, vendors }) {
  const [form, setForm] = useState({
    part_number: '', purchase_order: '', vendor_id: '', vendor_name: '',
    issue_type: 'Damaged in Transit', description: '', log_status: 'Reported', photo_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleVendorChange = (id) => {
    const v = vendors.find(v => v.id === id);
    setForm(f => ({ ...f, vendor_id: id, vendor_name: v?.name || '' }));
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-xl rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#152A45' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Log Damaged / Incorrect Part</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Part Photo</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
              style={{ backgroundColor: '#0D1B2A' }}
            >
              {form.photo_url ? (
                <img src={form.photo_url} alt="part" className="w-full h-full object-cover" />
              ) : uploading ? (
                <p className="text-sm" style={{ color: '#94a3b8' }}>Uploading...</p>
              ) : (
                <>
                  <Camera className="w-8 h-8 mb-2" style={{ color: '#64748b' }} />
                  <p className="text-sm" style={{ color: '#64748b' }}>Click to upload photo</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Part Number *</label>
              <input required value={form.part_number} onChange={e => setForm(f => ({ ...f, part_number: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none" style={{ backgroundColor: '#0D1B2A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Purchase Order</label>
              <input value={form.purchase_order} onChange={e => setForm(f => ({ ...f, purchase_order: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none" style={{ backgroundColor: '#0D1B2A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Issue Type *</label>
              <select required value={form.issue_type} onChange={e => setForm(f => ({ ...f, issue_type: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none" style={{ backgroundColor: '#0D1B2A' }}>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Vendor</label>
              <select value={form.vendor_id} onChange={e => handleVendorChange(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none" style={{ backgroundColor: '#0D1B2A' }}>
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2 rounded text-sm text-white border border-white/10 focus:outline-none resize-none" style={{ backgroundColor: '#0D1B2A' }} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm font-medium border border-white/20 text-white hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: '#3B82F6' }}>
              Submit Return Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = async () => {
    const [r, v] = await Promise.all([
      base44.entities.ReturnLog.list('-created_date', 100),
      base44.entities.Vendor.list(),
    ]);
    setReturns(r);
    setVendors(v);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (form) => {
    await base44.entities.ReturnLog.create(form);
    setShowModal(false);
    fetchData();
  };

  const handleStatusUpdate = async (id, log_status) => {
    await base44.entities.ReturnLog.update(id, { log_status });
    fetchData();
  };

  const filtered = returns.filter(r => statusFilter === 'All' || r.log_status === statusFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Returns & Log</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Damaged parts, wrong items, and return requests</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: '#3B82F6' }}>
          <Plus className="w-4 h-4" /> Log Return
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['All', ...LOG_STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ backgroundColor: statusFilter === s ? '#3B82F6' : '#1E3A5F', color: statusFilter === s ? '#fff' : '#94a3b8' }}>
            {s}
          </button>
        ))}
      </div>

      <SectionCard title={`Return Logs (${filtered.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10" style={{ backgroundColor: '#0D1B2A' }}>
                {['Photo', 'Part #', 'PO #', 'Issue Type', 'Vendor', 'Description', 'Report Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10" style={{ color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10" style={{ color: '#64748b' }}>No return logs. Use "Log Return" to report a damaged or incorrect part.</td></tr>
              ) : filtered.map(ret => (
                <tr key={ret.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    {ret.photo_url ? (
                      <img src={ret.photo_url} alt="part" className="w-14 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-14 h-14 rounded flex items-center justify-center text-xs" style={{ backgroundColor: '#1E3A5F', color: '#64748b' }}>No img</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#3B82F6' }}>{ret.part_number}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{ret.purchase_order || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={ret.issue_type} /></td>
                  <td className="px-4 py-3 text-xs text-white">{ret.vendor_name || '—'}</td>
                  <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: '#94a3b8' }}>{ret.description || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                    {ret.created_date ? new Date(ret.created_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={ret.log_status} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={ret.log_status}
                      onChange={e => handleStatusUpdate(ret.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-white/20 text-white focus:outline-none"
                      style={{ backgroundColor: '#0D1B2A' }}
                    >
                      {LOG_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {showModal && <ReturnModal vendors={vendors} onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}