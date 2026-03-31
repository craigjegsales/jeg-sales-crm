import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const PRODUCTS = ['Typar', 'NanaWall', 'Omega Fence', 'Advanced Building Products', 'Other'];

const stageBadge = (stage) => {
  const map = { 'Lead': 'badge-lead', 'Qualified': 'badge-qualified', 'Proposal': 'badge-proposal', 'Negotiation': 'badge-negotiation', 'Closed Won': 'badge-won', 'Closed Lost': 'badge-lost' };
  return map[stage] || 'badge-lead';
};

const productBadge = (product) => {
  const map = { 'Typar': 'badge-typar', 'NanaWall': 'badge-nanawall', 'Omega Fence': 'badge-omega', 'Advanced Building Products': 'badge-abp' };
  return map[product] || 'badge-other';
};

function OpportunityModal({ opp, accounts, contacts, onClose, onSave }) {
  const [form, setForm] = useState(opp || {
    title: '', account_id: '', contact_id: '', product_line: 'Typar',
    stage: 'Lead', value: '', expected_close: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    const data = {
      ...form,
      value: form.value ? parseFloat(form.value) : null,
      account_id: form.account_id || null,
      contact_id: form.contact_id || null,
    };
    const { data: { user } } = await supabase.auth.getUser();
    if (opp?.id) {
      await supabase.from('opportunities').update(data).eq('id', opp.id);
    } else {
      await supabase.from('opportunities').insert({ ...data, user_id: user.id });
    }
    setSaving(false);
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{opp?.id ? 'Edit Opportunity' : 'New Opportunity'}</div>

        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Typar Spec - JPI Downtown" />
        </div>
        <div className="form-group">
          <label className="form-label">Product Line</label>
          <select className="form-select" value={form.product_line} onChange={e => set('product_line', e.target.value)}>
            {PRODUCTS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Stage</label>
          <select className="form-select" value={form.stage} onChange={e => set('stage', e.target.value)}>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Account</label>
          <select className="form-select" value={form.account_id} onChange={e => set('account_id', e.target.value)}>
            <option value="">— No Account —</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Contact</label>
          <select className="form-select" value={form.contact_id} onChange={e => set('contact_id', e.target.value)}>
            <option value="">— No Contact —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estimated Value ($)</label>
          <input className="form-input" type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder="50000" />
        </div>
        <div className="form-group">
          <label className="form-label">Expected Close</label>
          <input className="form-input" type="date" value={form.expected_close} onChange={e => set('expected_close', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Details about this opportunity..." style={{ resize: 'vertical' }} />
        </div>

        <button className="btn-primary" onClick={save} disabled={saving || !form.title}>
          {saving ? 'Saving...' : 'Save Opportunity'}
        </button>
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [opps, setOpps] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stageFilter, setStageFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    const [o, a, c] = await Promise.all([
      supabase.from('opportunities').select('*, accounts(name), contacts(first_name,last_name)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('accounts').select('id,name').eq('user_id', user.id).order('name'),
      supabase.from('contacts').select('id,first_name,last_name').eq('user_id', user.id).order('last_name')
    ]);
    setOpps(o.data || []);
    setAccounts(a.data || []);
    setContacts(c.data || []);
  }

  const filtered = opps.filter(o => {
    const matchStage = stageFilter === 'All' || o.stage === stageFilter;
    const matchProduct = productFilter === 'All' || o.product_line === productFilter;
    return matchStage && matchProduct;
  });

  const totalValue = filtered.filter(o => !['Closed Lost'].includes(o.stage)).reduce((s, o) => s + (o.value || 0), 0);

  const fmt = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">Pipeline</div>
            <div className="page-subtitle">{filtered.length} opportunities · {fmt(totalValue)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 12px 0', overflowX: 'auto' }}>
        {['All', ...STAGES.slice(0, 4)].map(s => (
          <button key={s} onClick={() => setStageFilter(s)} style={{
            background: stageFilter === s ? 'var(--accent)' : 'var(--bg-card)',
            color: stageFilter === s ? 'white' : 'var(--text-secondary)',
            border: '1px solid ' + (stageFilter === s ? 'var(--accent)' : 'var(--border)'),
            borderRadius: 20, padding: '6px 12px', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}>{s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto' }}>
        {['All', ...PRODUCTS].map(p => (
          <button key={p} onClick={() => setProductFilter(p)} style={{
            background: productFilter === p ? 'var(--bg-card)' : 'transparent',
            color: productFilter === p ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: '1px solid ' + (productFilter === p ? 'var(--accent)' : 'transparent'),
            borderRadius: 20, padding: '5px 10px', fontSize: 11,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}>{p}</button>
        ))}
      </div>

      <div style={{ marginTop: 4 }}>
        {filtered.map(opp => (
          <div key={opp.id} className="card" onClick={() => { setSelected(opp); setShowModal(true); }} style={{ cursor: 'pointer' }}>
            <div className="card-row" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 15, flex: 1, paddingRight: 8 }}>{opp.title}</div>
              {opp.value && <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14 }}>{fmt(opp.value)}</div>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className={`badge ${stageBadge(opp.stage)}`}>{opp.stage}</span>
              <span className={`badge ${productBadge(opp.product_line)}`}>{opp.product_line}</span>
            </div>
            {opp.accounts?.name && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                🏢 {opp.accounts.name}
                {opp.contacts && ` · ${opp.contacts.first_name} ${opp.contacts.last_name}`}
              </div>
            )}
            {opp.expected_close && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                Close: {new Date(opp.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => { setSelected(null); setShowModal(true); }}>+</button>

      {showModal && (
        <OpportunityModal
          opp={selected}
          accounts={accounts}
          contacts={contacts}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={() => { setShowModal(false); setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
