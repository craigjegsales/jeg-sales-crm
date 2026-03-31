import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CATEGORY_META = {
  Builder:     { icon: 'B', color: 'var(--typar)' },
  Architect:   { icon: 'A', color: 'var(--nanawall)' },
  Contractor:  { icon: 'C', color: 'var(--omega)' },
  Distributor: { icon: 'D', color: 'var(--abp)' },
};

const PRODUCT_COLORS = {
  Typar: '#f97316',
  NanaWall: '#a855f7',
  'Omega Fence': '#22c55e',
  ABP: '#3b82f6',
};

const ORDER = ['Builder', 'Architect', 'Contractor', 'Distributor'];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: accts } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('user_id', user.id)
      .in('name', ['Builder', 'Architect', 'Contractor', 'Distributor']);

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, title, phone, email, products, account_id')
      .eq('user_id', user.id)
      .filter('account_id', 'not.is', 'null');

    const sorted = (accts || []).sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
    setAccounts(sorted);
    setAllContacts(contacts || []);
    setLoading(false);
  }

  const initials = c => `${c.first_name[0] || ''}${c.last_name[0] || ''}`.toUpperCase();

  if (activeAccount) {
    const meta = CATEGORY_META[activeAccount.name] || { icon: 'X', color: 'var(--accent)' };
    const contacts = allContacts.filter(c => c.account_id === activeAccount.id);
    const filtered = contacts.filter(c =>
      `${c.first_name} ${c.last_name} ${c.title || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="page">
        <div className="page-header">
          <button onClick={() => { setActiveAccount(null); setSearch(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 16, cursor: 'pointer', padding: '4px 0', fontWeight: 600, marginBottom: 8 }}>
            Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div className="page-title">{activeAccount.name}</div>
              <div className="page-subtitle">{contacts.length} contacts</div>
            </div>
          </div>
        </div>

        <div className="search-bar">
          <span style={{ color: 'var(--text-secondary)' }}>Search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeAccount.name.toLowerCase()}s...`} />
        </div>

        <div style={{ marginTop: 8 }}>
          {filtered.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
              No contacts in this category yet.
            </div>
          )}
          {filtered.map(contact => (
            <div key={contact.id} className="list-item">
              <div className="avatar" style={{ border: '2px solid ' + meta.color }}>
                {initials(contact)}
              </div>
              <div style={{ flex: 1 }}>
                <div className="item-name">{contact.first_name} {contact.last_name}</div>
                <div className="item-sub">{contact.title || ''}</div>
                {contact.products && contact.products.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {contact.products.map(p => (
                      <span key={p} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: (PRODUCT_COLORS[p] || '#888') + '22', color: PRODUCT_COLORS[p] || '#888', border: '1px solid ' + (PRODUCT_COLORS[p] || '#888') }}>
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 14 }}>Call</a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 14 }}>Email</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Accounts</div>
        <div className="page-subtitle">Contact categories</div>
      </div>

      <div style={{ padding: '8px 12px' }}>
        {loading && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>Loading...</div>
        )}
        {accounts.map(acct => {
          const m = CATEGORY_META[acct.name] || { icon: 'X', color: 'var(--accent)' };
          const count = allContacts.filter(c => c.account_id === acct.id).length;
          return (
            <div
              key={acct.id}
              onClick={() => setActiveAccount(acct)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: '4px solid ' + m.color,
                borderRadius: 12,
                padding: '16px 14px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{acct.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {count} contacts
                </div>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 18 }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
