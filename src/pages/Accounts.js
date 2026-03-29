import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { name: 'Builder',     icon: '\uD83C\uDFD7', color: 'var(--typar)',         id: '05bbc090-9e1b-45a1-946c-7cb05ff1a8a7' },
  { name: 'Architect',   icon: '\uD83D\uDCCD', color: 'var(--nanawall)',      id: '3e18c7a8-74f6-4ccb-93c6-ec7e3f3f2ea3' },
  { name: 'Contractor',  icon: '\uD83D\uDD27', color: 'var(--omega)',         id: 'e07b20c7-c6c5-48f4-98b4-2395f701df8b' },
  { name: 'Distributor', icon: '\uD83D\uDCE6', color: 'var(--abp)',           id: '0487a5e3-b382-4661-bc96-e830df10852a' },
];

// â”€â”€ Category Detail View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CategoryDetail({ category, onBack }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadContacts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadContacts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, title, phone, email')
      .eq('account_id', category.id)
      .order('last_name');
    if (error) console.error('Error loading contacts:', error);
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
        {!loading && filtered.length === 0 && (
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
  const [counts, setCounts] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => { loadCounts(); }, []);

  async function loadCounts() {
    const results = {};
    await Promise.all(
      CATEGORIES.map(async cat => {
        const { count } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', cat.id);
        results[cat.name] = count || 0;
      })
    );
    setCounts(results);
  }

  if (activeCategory) {
    return (
      <CategoryDetail
        category={activeCategory}
        onBack={() => { setActiveCategory(null); loadCounts(); }}
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
                {counts[cat.name] !== undefined ? counts[cat.name] : '...'} contacts
              </div>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{'\u203A'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
