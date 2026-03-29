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

  useEffect(() => { loadContacts(); }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadContacts() {
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, title, company, phone, email')
      .eq('account_id', accountId)
      .order('last_name');
    setContacts(data || []);
  }

  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.company || ''} ${c.title || ''}`.toLowerCase().includes(search.toLowerCase())
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
            <div className="page-subtitle">{contacts.length} contacts</div>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <span style={{ color: 'var(--text-secondary)' }}>{'\uD83D\uDD0D'}</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${category.name.toLowerCase()}s...`} />
      </div>

      <div style={{ marginTop: 8 }}>
        {filtered.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            No contacts in this category yet.{'\n'}Add a contact and set their account to {category.name}.
          </div>
        )}
        {filtered.map(contact => (
          <div key={contact.id} className="list-item">
            <div className="avatar" style={{ borderColor: category.color, border: '2px solid' }}>
              {initials(contact)}
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-name">{contact.first_name} {contact.last_name}</div>
              <div className="item-sub">
                {contact.title || ''}
                {contact.title && contact.company ? ' \u00b7 ' : ''}
                {contact.company || ''}
              </div>
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
  const [accountMap, setAccountMap] = useState({});
  const [contactCounts, setContactCounts] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    // Load the 4 category accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name')
      .in('name', ['Builder', 'Architect', 'Contractor', 'Distributor']);

    if (!accounts) return;

    // Build a map of name -> id
    const map = {};
    accounts.forEach(a => { map[a.name] = a.id; });
    setAccountMap(map);

    // Count contacts per category
    const counts = {};
    await Promise.all(
      accounts.map(async a => {
        const { count } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', a.id);
        counts[a.name] = count || 0;
      })
    );
    setContactCounts(counts);
  }

  if (activeCategory) {
    return (
      <CategoryDetail
        category={activeCategory}
        accountId={accountMap[activeCategory.name]}
        onBack={() => { setActiveCategory(null); load(); }}
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
        {CATEGORIES.map(cat => (
          <div
            key={cat.name}
            onClick={() => setActiveCategory(cat)}
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
                {contactCounts[cat.name] !== undefined ? contactCounts[cat.name] : '...'} contacts
              </div>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{'\u203A'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
