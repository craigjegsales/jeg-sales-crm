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
        ...form,
        account_id: form.account_id || null,
      };
      let result;
      if (contact?.id) {
        result = await supabase.from('contacts').update(cleanForm).eq('id', contact.id);
      } else {
        result = await supabase.from('contacts').insert(cleanForm);
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
          {saving ? 'Saving...' : 'Save Contact'}
        </button>
      </div>
    </div>
  );
}

function CardScanModal({ accounts, onClose, onSave }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      setError('Camera not available. Please allow camera access.');
    }
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
  }

  async function capture() {
    if (!videoRef.current) return;
    setScanning(true);
    setError('');
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    try {
      const response = await fetch('/api/scan-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64 })
      });
      const parsed = await response.json();
      if (parsed.error) {
        setError('Could not read card: ' + parsed.error);
      } else {
        setResult(parsed);
        setForm({ ...parsed, account_id: '', notes: '' });
        stopCamera();
      }
    } catch (err) {
      setError('Scan failed. Please try again.');
    }
    setScanning(false);
  }

  async function saveContact() {
    setSaving(true);
    const { company, website, ...contactData } = form;
    await supabase.from('contacts').insert(contactData);
    setSaving(false);
    onSave();
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '95vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">Scan Business Card</div>
        {!result ? (
          <>
            <div className="camera-container" style={{ marginBottom: 16 }}>
              {error ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'var(--danger)', fontSize: 14, padding: 20, textAlign: 'center' }}>{error}</div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted />
              )}
            </div>
            {!error && (
              <button className="btn-primary" onClick={capture} disabled={scanning}>
                {scanning ? 'Reading card...' : 'Capture Card'}
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--success)' }}>
              Card scanned! Review and save below.
            </div>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Link to Account</label>
              <select className="form-select" value={form.account_id} onChange={e => set('account_id', e.target.value)}>
                <option value="">— No Account —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input className="form-input" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
            </div>
            <button className="btn-primary" onClick={saveContact} disabled={saving || !form.first_name}>
              {saving ? 'Saving...' : 'Save Contact'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [c, a] = await Promise.all([
      supabase.from('contacts').select('*, accounts(name)').order('last_name'),
      supabase.from('accounts').select('id, name').order('name')
    ]);
    setContacts(c.data || []);
    setAccounts(a.data || []);
  }

  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.title} ${c.accounts?.name}`.toLowerCase().includes(search.toLowerCase())
  );

  const initials = c => `${c.first_name[0] || ''}${c.last_name[0] || ''}`.toUpperCase();

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="page-title">Contacts</div>
            <div className="page-subtitle">{contacts.length} total</div>
          </div>
          <button onClick={() => setShowScan(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Scan Card
          </button>
        </div>
      </div>
      <div className="search-bar">
        <span style={{ color: 'var(--text-secondary)' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." />
      </div>
      <div style={{ marginTop: 8 }}>
        {filtered.map(contact => (
          <div key={contact.id} className="list-item" onClick={() => { setSelected(contact); setShowModal(true); }}>
            <div className="avatar">{initials(contact)}</div>
            <div style={{ flex: 1 }}>
              <div className="item-name">{contact.first_name} {contact.last_name}</div>
              <div className="item-sub">{contact.title}{contact.title && contact.accounts?.name ? ' · ' : ''}{contact.accounts?.name}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 18 }}>📞</a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 18 }}>✉️</a>
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="fab" onClick={() => { setSelected(null); setShowModal(true); }}>+</button>
      {showModal && (
        <ContactModal
          contact={selected}
          accounts={accounts}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={() => { setShowModal(false); setSelected(null); load(); }}
        />
      )}
      {showScan && (
        <CardScanModal
          accounts={accounts}
          onClose={() => setShowScan(false)}
          onSave={() => { setShowScan(false); load(); }}
        />
      )}
    </div>
  );
}

