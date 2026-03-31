import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const PRODUCTS = [
  { name: 'Typar',       color: '#f97316' },
  { name: 'NanaWall',    color: '#a855f7' },
  { name: 'Omega Fence', color: '#22c55e' },
  { name: 'ABP',         color: '#3b82f6' },
];

function ProductTags({ selected = [], onChange }) {
  function toggle(name) {
    if (selected.includes(name)) {
      onChange(selected.filter(p => p !== name));
    } else {
      onChange([...selected, name]);
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {PRODUCTS.map(p => {
        const on = selected.includes(p.name);
        return (
          <button key={p.name} onClick={() => toggle(p.name)} style={{
            padding: '6px 12px', borderRadius: 20, border: '1.5px solid ' + p.color,
            background: on ? p.color : 'transparent',
            color: on ? 'white' : p.color,
            fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}>{p.name}</button>
        );
      })}
    </div>
  );
}

function ContactModal({ contact, accounts, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(contact || {
    first_name: '', last_name: '', title: '', email: '', phone: '', mobile: '',
    account_id: '', city: '', state: '', notes: '', products: []
  });
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sanitize = (f) => {
    const { accounts, ...rest } = f;
    return {
      ...rest,
      account_id: rest.account_id || null,
      email: rest.email || null,
      phone: rest.phone || null,
      mobile: rest.mobile || null,
      city: rest.city || null,
      state: rest.state || null,
      notes: rest.notes || null,
      products: rest.products || [],
    };
  };

  async function save() {
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let result;
      if (contact?.id) {
        result = await supabase.from('contacts').update(sanitize(form)).eq('id', contact.id);
      } else {
        result = await supabase.from('contacts').insert({ ...sanitize(form), user_id: user.id });
      }
      if (result.error) { setError('Save failed: ' + result.error.message); setSaving(false); return; }
      setSaving(false);
      onSave();
    } catch (err) { setError('Error: ' + err.message); setSaving(false); }
  }

  async function deleteContact() {
    setSaving(true);
    await supabase.from('contacts').delete().eq('id', contact.id);
    setSaving(false);
    onDelete();
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
          <input className="form-input" value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="VP of Construction" />
        </div>
        <div className="form-group">
          <label className="form-label">Account</label>
          <select className="form-select" value={form.account_id || ''} onChange={e => set('account_id', e.target.value)}>
            <option value="">-- No Account --</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="name@company.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">Mobile</label>
          <input className="form-input" type="tel" value={form.mobile || ''} onChange={e => set('mobile', e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Dallas" />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input className="form-input" value={form.state || ''} onChange={e => set('state', e.target.value)} placeholder="TX" maxLength={2} />
        </div>
        <div className="form-group">
          <label className="form-label">Product Lines</label>
          <ProductTags selected={form.products || []} onChange={v => set('products', v)} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input" value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Notes about this contact..." style={{ resize: 'vertical' }} />
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>}
        <button className="btn-primary" onClick={save} disabled={saving || !form.first_name || !form.last_name}>
          {saving ? 'Saving...' : 'Save Contact'}
        </button>
        {contact?.id && !confirming && (
          <button onClick={() => setConfirming(true)} style={{ width: '100%', marginTop: 10, padding: '13px', borderRadius: 12, border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Delete Contact
          </button>
        )}
        {confirming && (
          <div style={{ marginTop: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 12, padding: 14 }}>
            <div style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>
              Delete {form.first_name} {form.last_name}? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={deleteContact} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--danger)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}
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
        setForm({ ...parsed, account_id: '', notes: '', products: [] });
        stopCamera();
      }
    } catch (err) {
      setError('Scan failed. Please try again.');
    }
    setScanning(false);
  }

  async function saveContact() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { company, website, ...contactData } = form;
    await supabase.from('contacts').insert({
      ...contactData,
      account_id: contactData.account_id || null,
      products: contactData.products || [],
      user_id: user.id,
    });
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
              <input className="form-input" value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={form.title || ''} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company || ''} onChange={e => set('company', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Link to Account</label>
              <select className="form-select" value={form.account_id || ''} onChange={e => set('account_id', e.target.value)}>
                <option value="">-- No Account --</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Product Lines</label>
              <ProductTags selected={form.products || []} onChange={v => set('products', v)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input className="form-input" value={form.mobile || ''} onChange={e => set('mobile', e.target.value)} />
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
    const { data: { user } } = await supabase.auth.getUser();
    const [c, a] = await Promise.all([
      supabase.from('contacts').select('*, accounts(name)').eq('user_id', user.id).order('last_name'),
      supabase.from('accounts').select('id, name').eq('user_id', user.id).order('name')
    ]);
    setContacts(c.data || []);
    setAccounts(a.data || []);
  }

  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.title} ${c.accounts?.name}`.toLowerCase().includes(search.toLowerCase())
  );

  const initials = c => `${c.first_name[0] || ''}${c.last_name[0] || ''}`.toUpperCase();
  const productColors = { Typar: '#f97316', NanaWall: '#a855f7', 'Omega Fence': '#22c55e', ABP: '#3b82f6' };

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
        <span style={{ color: 'var(--text-secondary)' }}>Search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." />
      </div>
      <div style={{ marginTop: 8 }}>
        {filtered.map(contact => (
          <div key={contact.id} className="list-item" onClick={() => { setSelected(contact); setShowModal(true); }}>
            <div className="avatar">{initials(contact)}</div>
            <div style={{ flex: 1 }}>
              <div className="item-name">{contact.first_name} {contact.last_name}</div>
              <div className="item-sub">{contact.title}{contact.title && contact.accounts?.name ? ' - ' : ''}{contact.accounts?.name}</div>
              {contact.products && contact.products.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  {contact.products.map(p => (
                    <span key={p} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: productColors[p] + '22', color: productColors[p], border: '1px solid ' + productColors[p] }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 18 }}>Call</a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 18 }}>Email</a>
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
          onDelete={() => { setShowModal(false); setSelected(null); load(); }}
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
