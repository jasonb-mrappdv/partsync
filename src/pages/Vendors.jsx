import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import SectionCard from '@/components/SectionCard';
import { Plus, X, Star, Pencil, Trash2 } from 'lucide-react';

function VendorModal({ vendor, onClose, onSave }) {
  const [form, setForm] = useState(vendor || {
    name: '', key_contact: '', email: '', phone: '', directory: '',
    part_categories: [], avg_score: 5, is_active: true
  });
  const [catInput, setCatInput] = useState('');

  const addCategory = () => {
    if (catInput.trim() && !form.part_categories?.includes(catInput.trim())) {
      setForm(f => ({ ...f, part_categories: [...(f.part_categories || []), catInput.trim()] }));
      setCatInput('');
    }
  };
  const removeCategory = (cat) => {
    setForm(f => ({ ...f, part_categories: f.part_categories.filter(c => c !== cat) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-xl border border-border overflow-hidden bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">{vendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Vendor Name *', key: 'name', required: true },
              { label: 'Key Contact', key: 'key_contact' },
              { label: 'Email *', key: 'email', type: 'email', required: true },
              { label: 'Phone', key: 'phone' },
              { label: 'Directory', key: 'directory' },
            ].map(({ label, key, required, type }) => (
              <div key={key} className={key === 'directory' ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">{label}</label>
                <input type={type || 'text'} required={required} value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Part Categories</label>
            <div className="flex gap-2 mb-2">
              <input value={catInput} onChange={e => setCatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                placeholder="e.g. Engine, Brakes..."
                className="flex-1 px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
              <button type="button" onClick={addCategory} className="px-3 py-2 rounded text-sm font-medium text-white bg-secondary border border-border">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.part_categories || []).map(cat => (
                <span key={cat} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-secondary text-primary">
                  {cat}
                  <button type="button" onClick={() => removeCategory(cat)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Rating (1-5)</label>
            <input type="number" min={1} max={5} value={form.avg_score || 5}
              onChange={e => setForm(f => ({ ...f, avg_score: Number(e.target.value) }))}
              className="w-24 px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
            <label className="text-sm text-white">Active vendor</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm font-medium border border-border text-white hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded text-sm font-semibold text-white bg-primary">
              {vendor ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RuleModal({ onClose, onSave, vendors }) {
  const [form, setForm] = useState({ rule_name: '', description: '', part_category: '', vendor_id: '', vendor_name: '', priority: 1, is_active: true });

  const handleVendorChange = (id) => {
    const v = vendors.find(v => v.id === id);
    setForm(f => ({ ...f, vendor_id: id, vendor_name: v?.name || '' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-xl border border-border overflow-hidden bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Add Routing Rule</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          {[
            { label: 'Rule Name *', key: 'rule_name', required: true },
            { label: 'Part Category', key: 'part_category' },
            { label: 'Priority', key: 'priority', type: 'number' },
          ].map(({ label, key, required, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">{label}</label>
              <input type={type || 'text'} required={required} value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none resize-none bg-background" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Assigned Vendor *</label>
            <select required value={form.vendor_id} onChange={e => handleVendorChange(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm text-white border border-border focus:outline-none bg-background">
              <option value="">Select vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm font-medium border border-border text-white hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded text-sm font-semibold text-white bg-primary">Add Rule</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);

  const fetchData = async () => {
    const [v, r] = await Promise.all([
      base44.entities.Vendor.list(),
      base44.entities.RoutingRule.list('-priority'),
    ]);
    setVendors(v);
    setRules(r);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveVendor = async (form) => {
    if (editVendor) {
      await base44.entities.Vendor.update(editVendor.id, form);
    } else {
      await base44.entities.Vendor.create(form);
    }
    setShowVendorModal(false);
    setEditVendor(null);
    fetchData();
  };

  const handleSaveRule = async (form) => {
    await base44.entities.RoutingRule.create(form);
    setShowRuleModal(false);
    fetchData();
  };

  const handleDeleteVendor = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    await base44.entities.Vendor.delete(id);
    fetchData();
  };

  const handleDeleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await base44.entities.RoutingRule.delete(id);
    fetchData();
  };

  const renderStars = (score) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="w-3 h-3" fill={i < score ? '#FBBF24' : 'none'} stroke={i < score ? '#FBBF24' : '#475569'} />
    ));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendor Management & Routing</h1>
        <p className="text-sm mt-0.5 text-muted-foreground">Manage vendors and configure routing rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor List */}
        <SectionCard title="Vendor List" action={
          <button onClick={() => { setEditVendor(null); setShowVendorModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white bg-primary">
            <Plus className="w-3.5 h-3.5" /> Add Vendor
          </button>
        }>
          <div>
            <div className="grid grid-cols-4 gap-2 px-4 py-2.5 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-background/50">
              <span>Vendor</span>
              <span>Contact</span>
              <span>Orders</span>
              <span>Rating</span>
            </div>
            {loading ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Loading...</p>
            ) : vendors.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No vendors yet.</p>
            ) : vendors.map(v => (
              <div key={v.id} className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-border/40 hover:bg-white/5 transition-colors items-center">
                <div>
                  <p className="text-sm font-medium text-white">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.directory || 'Directory'}</p>
                </div>
                <div>
                  <p className="text-xs text-white">{v.key_contact || '—'}</p>
                  <p className="text-xs text-muted-foreground">{v.email}</p>
                </div>
                <div>
                  <p className="text-xs text-white">{v.total_orders || 0}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${v.is_active ? 'text-green-400' : 'text-slate-500'}`}
                    style={{ backgroundColor: v.is_active ? '#14532d' : '#1e293b' }}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">{renderStars(v.avg_score || 3)}</div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditVendor(v); setShowVendorModal(true); }}
                      className="p-1 rounded hover:bg-white/10"><Pencil className="w-3.5 h-3.5 text-slate-400" /></button>
                    <button onClick={() => handleDeleteVendor(v.id)}
                      className="p-1 rounded hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Routing Rules */}
        <SectionCard title="Routing Rules" action={
          <button onClick={() => setShowRuleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white bg-primary">
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        }>
          <div>
            <div className="px-4 py-2.5 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-background/50">
              Rules Description
            </div>
            {loading ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Loading...</p>
            ) : rules.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No routing rules configured.</p>
            ) : rules.map(rule => (
              <div key={rule.id} className="flex items-start justify-between px-4 py-3 border-b border-border/40 hover:bg-white/5 transition-colors gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{rule.rule_name}</p>
                  {rule.description && <p className="text-xs mt-0.5 text-muted-foreground">{rule.description}</p>}
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {rule.part_category && (
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-primary">{rule.part_category}</span>
                    )}
                    {rule.vendor_name && (
                      <span className="text-xs px-2 py-0.5 rounded bg-background text-muted-foreground">→ {rule.vendor_name}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDeleteRule(rule.id)} className="p-1 rounded hover:bg-red-900/20 mt-0.5">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {showVendorModal && <VendorModal vendor={editVendor} onClose={() => { setShowVendorModal(false); setEditVendor(null); }} onSave={handleSaveVendor} />}
      {showRuleModal && <RuleModal vendors={vendors} onClose={() => setShowRuleModal(false)} onSave={handleSaveRule} />}
    </div>
  );
}