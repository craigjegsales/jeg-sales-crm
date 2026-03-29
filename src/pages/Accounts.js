import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { name: 'Builder',     icon: '\uD83C\uDFD7', color: 'var(--typar)' },
  { name: 'Architect',   icon: '\uD83D\uDCCD', color: 'var(--nanawall)' },
  { name: 'Contractor',  icon: '\uD83D\uDD27', color: 'var(--omega)' },
  { name: 'Distributor', icon: '\uD83D\uDCE6', color: 'var(--abp)' },
];

// â”€â”€ Category Detail View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CategoryDetail({ category, accountId, onBack }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accountId) loadContacts();
    else setLoading(false);
  }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadContacts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, title, phone, email')
      .eq('account_id', accountId)
      .order('last_name');
    console.log('Contacts for', category.name, ':', data, error);
    setContacts(data || []);
    setLoading(false);
  }

  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.title || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const initials = c => `${c.first_name[0] || ''}${c.last_name[0] || ''}`.toUpperCase();

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 16, cursor: 'pointer', padding: '4px 0', fontWeight: 600, marginBottom: 8 }}>
          {'\u2190'} Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{category.icon}</span>
          <div>
            <div className="page-title">{category.name}</div>
            <div className="page-subtitle">{loading ? '...' : `${contacts.length} contacts`}</div>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <span style={{ color: 'var(--text-secondary)' }}>{'\uD83D\uDD0D'}</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${category.name.toLowerCase()}s...`} />
      </div>

      <div style={{ marginTop: 8 }}>
        {loading && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            Loading...
          </div>
        )}
        {!loading && !accountId && (
          <div style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            Could not find this category. Try refreshing.
          </div>
        )}
        {!loading && accountId && filtered.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            No contacts in this category yet. Add a contact and set their account to {category.name}.
          </div>
        )}
        {filtered.map(contact => (
          <div key={contact.id} className="list-item">
            <div className="avatar" style={{ border: '2px solid ' + category.color }}>
              {initials(contact)}
            </div>
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
    </div>
  );
}

// â”€â”€ Accounts List (Category Folders) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Accounts() {
  const [categoryData, setCategoryData] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeAccountId, setActiveAccountId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, name, contacts(id)')
      .in('name', ['Builder', 'Architect', 'Contractor', 'Distributor']);

    console.log('Accounts loaded:', accounts, error);

    if (!accounts) return;

    // Merge with CATEGORIES to preserve order and icons
    const merged = CATEGORIES.map(cat => {
      const acct = accounts.find(a => a.name === cat.name);
      return {
        ...cat,
        accountId: acct?.id || null,
        count: acct?.contacts?.length || 0,
      };
    });
    setCategoryData(merged);
  }

  if (activeCategory) {
    return (
      <CategoryDetail
        category={activeCategory}
        accountId={activeAccountId}
        onBack={() => { setActiveCategory(null); setActiveAccountId(null); load(); }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Accounts</div>
        <div className="page-subtitle">Contact categories</div>
      </div>

      <div style={{ padding: '8px 12px' }}>
        {categoryData.map(cat => (
          <div
            key={cat.name}
            onClick={() => { setActiveCategory(cat); setActiveAccountId(cat.accountId); }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid ' + cat.color,
              borderRadius: 12,
              padding: '16px 14px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 28 }}>{cat.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {cat.count} contacts
              </div>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{'\u203A'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
