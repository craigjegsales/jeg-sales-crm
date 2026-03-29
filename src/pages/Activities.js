import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const TYPES = ['Call', 'Visit', 'Email', 'Note', 'Demo'];

function ActivityModal({ activity, accounts, contacts, onClose, onSave }) {
  const [form, setForm] = useState(activity || {
    type: 'Call', subject: '', notes: '', account_id: '', contact_id: '',
    activity_date: new Date().toISOString().slice(0, 16)
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sanitize = (f) => {
    const { accounts, contacts, ...rest } = f;
    return {
      ...rest,
      account_id: rest.account_id || null,
      contact_id: rest.contact_id || null,
      notes: rest.notes || null,
    };
  };

  async function save() {
    setSaving(true);
    setError('');
    try {
      let result;
      if (activity?.id) {
        result = await supabase.from('activities').update(sanitize(form)).eq('id', activity.id);
      } else {
        result = await supabase.from('activities').insert(sanitize(form));
      }
      if (result.error) { setError('Save failed: ' + result.error.message); setSaving(false); return; }
      setSaving(false);
      onSave();
    } catch (err) { setError('Error: ' + err.message); setSaving(false); }
  }

  const typeEmoji = { Call: '\uD83D\uDCDE', Visit: '\uD83C\uDFE2', Email: '\u2709\uFE0F', Note: '\uD83D\uDCDD', Demo: '\uD83C\uDFAF' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{activity?.id ? 'Edit Activity' : 'Log Activity'}</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => set('type', t)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid ' + (form.type === t ? 'var(--accent)' : 'var(--border)'),
              background: form.type === t ? 'rgba(46,125,247,0.15)' : 'var(--bg-card)',
              color: form.type === t ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 11, fontWeight: 600, textAlign: 'center'
            }}>
              <div>{typeEmoji[t]}</div>
              <div style={{ marginTop: 2 }}>{t}</div>
            </button>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">Subject *</label>
          <input className="form-input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Discussed Typar spec inclusion..." />
        </div>
        <div className="form-group">
          <label className="form-label">Account</label>
          <select className="form-select" value={form.account_id || ''} onChange={e => set('account_id', e.target.value)}>
            <option value="">{'\u2014'} No Account {'\u2014'}</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Contact</label>
          <select className="form-select" value={form.contact_id || ''} onChange={e => set('contact_id', e.target.value)}>
            <option value="">{'\u2014'} No Contact {'\u2014'}</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date & Time</label>
          <input className="form-input" type="datetime-local" value={form.activity_date} onChange={e => set('activity_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input" value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={4} placeholder="What happened? Next steps?" style={{ resize: 'vertical' }} />
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>}

        <button className="btn-primary" onClick={save} disabled={saving || !form.subject}>
          {saving ? 'Saving...' : 'Save Activity'}
        </button>
      </div>
    </div>
  );
}

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => { load(); }, []);

  async function load() {
    const [a, ac, c] = await Promise.all([
      supabase.from('activities').select('*, accounts(name), contacts(first_name,last_name)').order('activity_date', { ascending: false }),
      supabase.from('accounts').select('id,name').order('name'),
      supabase.from('contacts').select('id,first_name,last_name').order('last_name')
    ]);
    setActivities(a.data || []);
    setAccounts(ac.data || []);
    setContacts(c.data || []);
  }

  const filtered = activities.filter(a => typeFilter === 'All' || a.type === typeFilter);

  const typeEmoji = { Call: '\uD83D\uDCDE', Visit: '\uD83C\uDFE2', Email: '\u2709\uFE0F', Note: '\uD83D\uDCDD', Demo: '\uD83C\uDFAF' };

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = (now - date) / 1000 / 60;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Activity</div>
        <div className="page-subtitle">{activities.length} total logs</div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto' }}>
        {['All', ...TYPES].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            background: typeFilter === t ? 'var(--accent)' : 'var(--bg-card)',
            color: typeFilter === t ? 'white' : 'var(--text-secondary)',
            border: '1px solid ' + (typeFilter === t ? 'var(--accent)' : 'var(--border)'),
            borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
            {t !== 'All' && typeEmoji[t] + ' '}{t}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{'\uD83D\uDCCB'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>No activity yet</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Log calls, visits, and emails here</div>
        </div>
      )}

      <div>
        {filtered.map(activity => (
          <div key={activity.id} className="list-item" onClick={() => { setSelected(activity); setShowModal(true); }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{typeEmoji[activity.type] || '\uD83D\uDCDD'}</div>
            <div style={{ flex: 1 }}>
              <div className="item-name" style={{ fontSize: 14 }}>{activity.subject}</div>
              <div className="item-sub">
                {activity.accounts?.name || ''}{activity.contacts ? ` \u00b7 ${activity.contacts.first_name} ${activity.contacts.last_name}` : ''}
              </div>
              {activity.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{activity.notes}</div>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>{formatDate(activity.activity_date)}</div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => { setSelected(null); setShowModal(true); }}>+</button>

      {showModal && (
        <ActivityModal
          activity={selected}
          accounts={accounts}
          contacts={contacts}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={() => { setShowModal(false); setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
