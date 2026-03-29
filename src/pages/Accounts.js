 import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const TYPES = ['Builder', 'Architect', 'Contractor', 'Distributor', 'Other'];

const typeColor = (type) => {
  const colors = { Builder: 'var(--typar)', Architect: 'var(--nanawall)', Contractor: 'var(--omega)', Distributor: 'var(--abp)', Other: 'var(--text-secondary)' };
  return colors[type] || 'var(--text-secondary)';
};

// â”€â”€ Edit Account Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AccountModal({ account, onClose, onSave }) {
  const [form, setForm] = useState(account || {
    name: '', type: 'Builder', address: '', city: '', state: '', zip: '', phone: '', website: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sanitize = (f) => {
    const { contacts, ...rest } = f;
    return {
      ...rest,
      phone: rest.phone || null,
      website: rest.website || null,
      address: rest.address || null,
      city: rest.city || null,
      state: rest.state || null,
      zip: rest.zip || null,
      notes: rest.notes || null,
    };
  };

  async function save() {
    setSaving(true);
    setError('');
    try {
      let result;
      if (account?.id) {
        result = await supabase.from('accounts').update(sanitize(form)).eq('id', account.id);
      } else {
        result = await supabase.from('accounts').insert(sanitize(form));
      }
      if (result.error) { setError('Save failed: ' + result.error.message); setSaving(false); return; }
      setSaving(false);
      onSave();
    } catch (err) { setError('Error: ' + err.message); setSaving(false); }
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
          <input className="form-input" type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">Website</label>
          <input className="form-input" value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="www.example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="123 Main St" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: 8 }} className="form-group">
          <div>
            <label className="form-label">City</label>
            <input className="form-input" value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Dallas" />
          </div>
          <div>
            <label className="form-label">State</label>
            <input className="form-input" value={form.state || ''} onChange={e => set('state', e.target.value)} placeholder="TX" maxLength={2} />
          </div>
          <div>
            <label className="form-label">ZIP</label>
            <input className="form-input" value={form.zip || ''} onChange={e => set('zip', e.target.value)} placeholder="75001" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input" value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Notes about this account..." style={{ resize: 'vertical' }} />
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>}
        <button className="btn-primary" onClick={save} disabled={saving || !form.name}>
          {saving ? 'Saving...' : 'Save Account'}
        </button>
      </div>
    </div>
  );
}

// â”€â”€ New Contact Modal (pre-linked to account) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NewContactModal({ accountId, onClose, onSave }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', title: '', email: '', phone: '', mobile: '', city: '', state: '', notes: '',
    account_id: accountId
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    setError('');
    try {
      const result = await supabase.from('contacts').insert({
        ...form,
        account_id: accountId,
        email: form.email || null,
        phone: form.phone || null,
        mobile: form.mobile || null,
        city: form.city || null,
        state: form.state || null,
        notes: form.notes || null,
      });
      if (result.error) { setError('Save failed: ' + result.error.message); setSaving(false); return; }
      setSaving(false);
      onSave();
    } catch (err) { setError('Error: ' + err.message); setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">New Contact</div>
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

// â”€â”€ Link Existing Contact Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LinkContactModal({ accountId, onClose, onSave }) {
  const [allContacts, setAllContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    supabase.from('contacts').select('id, first_name, last_name, title').is('account_id', null).order('last_name')
      .then(({ data }) => setAllContacts(data || []));
  }, []);

  const filtered = allContacts.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  async function link(contactId) {
    setLinking(true);
    await supabase.from('contacts').update({ account_id: accountId }).eq('id', contactId);
    setLinking(false);
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">Link Existing Contact</div>
        <div className="search-bar" style={{ margin: '0 0 12px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{'\uD83D\uDD0D'}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search unlinked contacts..." />
        </div>
        {filtered.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 24 }}>
            No unlinked contacts found
          </div>
        )}
        {filtered.map(c => (
          <div key={c.id} className="list-item" onClick={() => !linking && link(c.id)} style={{ cursor: 'pointer' }}>
            <div className="avatar">{(c.first_name[0] || '').toUpperCase()}{(c.last_name[0] || '').toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div className="item-name">{c.first_name} {c.last_name}</div>
              {c.title && <div className="item-sub">{c.title}</div>}
            </div>
            <div style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Link</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Account Detail View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AccountDetail({ account, onBack, onAccountUpdated }) {
  const [contacts, setContacts] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [showLinkContact, setShowLinkContact] = useState(false);

  useEffect(() => { loadContacts(); }, [account.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadContacts() {
    const { data } = await supabase.from('contacts').select('*').eq('account_id', account.id).order('last_name');
    setContacts(data || []);
  }

  const initials = c => `${c.first_name[0] || ''}${c.last_name[0] || ''}`.toUpperCase();

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 16, cursor: 'pointer', padding: '4px 0', fontWeight: 600 }}>
            {'\u2190'} Back
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
          <div>
            <div className="page-title">{account.name}</div>
            <div className="page-subtitle" style={{ color: typeColor(account.type) }}>{account.type}</div>
          </div>
          <button onClick={() => setShowEdit(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Edit
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, margin: '0 12px 16px', padding: 14, border: '1px solid var(--border)' }}>
        {account.phone && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Phone</span>
            <a href={`tel:${account.phone}`} style={{ color: 'var(--accent)', fontSize: 13 }}>{account.phone}</a>
          </div>
        )}
        {account.website && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Website</span>
            <a href={`https://${account.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 13 }}>{account.website}</a>
          </div>
        )}
        {(account.city || account.state) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Location</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{account.city}{account.city && account.state ? ', ' : ''}{account.state}</span>
          </div>
        )}
        {account.notes && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>NOTES</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{account.notes}</div>
          </div>
        )}
      </div>

      {/* Contacts Section */}
      <div style={{ padding: '0 12px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Contacts <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({contacts.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowLinkContact(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Link Existing
            </button>
            <button onClick={() => setShowNewContact(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              + New
            </button>
          </div>
        </div>

        {contacts.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
            No contacts yet. Add one above.
          </div>
        )}

        {contacts.map(contact => (
          <div key={contact.id} className="list-item">
            <div className="avatar">{initials(contact)}</div>
            <div style={{ flex: 1 }}>
              <div className="item-name">{contact.first_name} {contact.last_name}</div>
              {contact.title && <div className="item-sub">{contact.title}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 18 }}>{'\uD83D\uDCDE'}</a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 18 }}>{'\u2709\uFE0F'}</a>
              )}
            </div>
          </div>
        ))}
      </div>

      {showEdit && (
        <AccountModal
          account={account}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); onAccountUpdated(); }}
        />
      )}
      {showNewContact && (
        <NewContactModal
          accountId={account.id}
          onClose={() => setShowNewContact(false)}
          onSave={() => { setShowNewContact(false); loadContacts(); }}
        />
      )}
      {showLinkContact && (
        <LinkContactModal
          accountId={account.id}
          onClose={() => setShowLinkContact(false)}
          onSave={() => { setShowLinkContact(false); loadContacts(); }}
        />
      )}
    </div>
  );
}

// â”€â”€ Accounts List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null);

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

  // Show account detail view
  if (detailAccount) {
    return (
      <AccountDetail
        account={detailAccount}
        onBack={() => { setDetailAccount(null); load(); }}
        onAccountUpdated={() => {
          // Refresh the account data in detail view
          supabase.from('accounts').select('*, contacts(id)').eq('id', detailAccount.id).single()
            .then(({ data }) => { if (data) setDetailAccount(data); load(); });
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Accounts</div>
        <div className="page-subtitle">{accounts.length} total</div>
      </div>

      <div className="search-bar">
        <span style={{ color: 'var(--text-secondary)' }}>{'\uD83D\uDD0D'}</span>
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
          <div key={account.id} className="list-item" onClick={() => setDetailAccount(account)}>
            <div className="avatar" style={{ background: 'var(--bg-card)', border: '2px solid ' + typeColor(account.type) }}>
              <span style={{ fontSize: 16 }}>{'\uD83C\uDFE2'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-name">{account.name}</div>
              <div className="item-sub">
                {account.type}{account.city ? ' \u00b7 ' + account.city : ''}{account.city && account.state ? ', ' : ''}{account.state} {'\u00b7'} {account.contacts?.length || 0} contacts
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => { setShowModal(true); }}>+</button>

      {showModal && (
        <AccountModal
          account={null}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
