import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const TYPES = ['Builder', 'Architect', 'Contractor', 'Distributor', 'Other'];

function AccountModal({ account, onClose, onSave }) {
  const [form, setForm] = useState(account || {
    name: '', type: 'Builder', address: '', city: '', state: '', zip: '', phone: '', website: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    if (account?.id) {
      await supabase.from('accounts').update(form).eq('id', account.id);
    } else {
      await supabase.from('accounts').insert(form);
    }
    setSaving(false);
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{account?.id ? 'Edit Account' : 'New Account'}</div>

        <div className="form-group">
          <label className="form-label">Company Name *</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme Builders" />
        </div>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">Website</label>
          <input className="form-input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="www.example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: 8 }} className="form-group">
          <div>
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Dallas" />
          </div>
          <div>
            <label className="form-label">State</label>
            <input className="form-input" value={form.state} onChange={e => set('state', e.target.value)} placeholder="TX" maxLength={2} />
          </div>
          <div>
            <label className="form-label">ZIP</label>
            <input className="form-input" value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="75001" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Notes about this account..." style={{ resize: 'vertical' }} />
        </div>

        <button className="btn-primary" onClick={save} disabled={saving || !form.name}>
          {saving ? 'Saving...' : 'Save Account'}
        </button>
      </div>
    </div>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('accounts').select('*, contacts(id)').order('name');
    setAccounts(data || []);
  }

  const types = ['All', ...TYPES];
  const filtered = accounts.filter(a => {
    const matchType = filter === 'All' || a.type === filter;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.city || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const typeColor = (type) => {
    const colors = { Builder: 'var(--typar)', Architect: 'var(--nanawall)', Contractor: 'var(--omega)', Distributor: 'var(--abp)', Other: 'var(--text-secondary)' };
    return colors[type] || 'var(--text-secondary)';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Accounts</div>
        <div className="page-subtitle">{accounts.length} total</div>
      </div>

      <div className="search-bar">
        <span style={{ color: 'var(--text-secondary)' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..." />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto' }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            background: filter === t ? 'var(--accent)' : 'var(--bg-card)',
            color: filter === t ? 'white' : 'var(--text-secondary)',
            border: '1px solid ' + (filter === t ? 'var(--accent)' : 'var(--border)'),
            borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}>{t}</button>
        ))}
      </div>

      <div>
        {filtered.map(account => (
          <div key={account.id} className="list-item" onClick={() => { setSelected(account); setShowModal(true); }}>
            <div className="avatar" style={{ background: 'var(--bg-card)', border: '2px solid ' + typeColor(account.type) }}>
              <span style={{ fontSize: 16 }}>🏢</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-name">{account.name}</div>
              <div className="item-sub">
                {account.type} · {account.city}{account.city && account.state ? ', ' : ''}{account.state} · {account.contacts?.length || 0} contacts
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => { setSelected(null); setShowModal(true); }}>+</button>

      {showModal && (
        <AccountModal
          account={selected}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={() => { setShowModal(false); setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
