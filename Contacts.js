import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

function ContactModal({ contact, accounts, onClose, onSave }) {
  const [form, setForm] = useState(contact || {
    first_name: '', last_name: '', title: '', email: '', phone: '', mobile: '',
    account_id: '', city: '', state: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    setError('');
    try {
      const cleanForm = {
        first_name: form.first_name,
        last_name: form.last_name,
        title: form.title || null,
        email: form.email || null,
        phone: form.phone || null,
        mobile: form.mobile || null,
        city: form.city || null,
        state: form.state || null,
        notes: form.notes || null,
        account_id: form.account_id || null,
      };
      const { data: { user } } = await supabase.auth.getUser();
      let result;
      if (contact?.id) {
        result = await supabase.from('contacts').update(cleanForm).eq('id', contact.id);
      } else {
        result = await supabase.from('contacts').insert({ ...cleanForm, user_id: user.id });
      }
      if (result.error) {
        setError('Save failed: ' + result.error.message);
        setSaving(false);
        return;
      }
      setSaving(false);
      onSave();
    } catch (err) {
      setError('Error: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{contact?.id ? 'Edit Contact' : 'New Contact'}</div>
        <div className="form-group">
          <label className="form-label">First Name *</label>
          <input className="form-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First" />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name *</label>
          <input className="form-input" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last" />
        </div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="VP of Construction" />
        </div>
        <div className="form-group">
          <label className="form-label">Account</label>
          <select className="form-select" value={form.account_id} onChange={e => set('account_id', e.target.value)}>
            <option value="">— No Account —</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@company.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">Mobile</label>
          <input className="form-input" type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Dallas" />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input className="form-input" value={form.state} onChange={e => set('state', e.target.value)} placeholder="TX" maxLength={2} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Notes about this contact..." style={{ resize: 'vertical' }} />
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>}
        <button className="btn-primary" onClick={save} disabled={saving || !form.first_name || !form.last_name}>
