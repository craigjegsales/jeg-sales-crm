import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CATEGORY_META = {
  Builder:     { icon: '\uD83C\uDFD7', color: 'var(--typar)' },
  Architect:   { icon: '\uD83D\uDCCD', color: 'var(--nanawall)' },
  Contractor:  { icon: '\uD83D\uDD27', color: 'var(--omega)' },
  Distributor: { icon: '\uD83D\uDCE6', color: 'var(--abp)' },
};

const PRODUCT_COLORS = {
  Typar: '#f97316',
  NanaWall: '#a855f7',
  'Omega Fence': '#22c55e',
  ABP: '#3b82f6',
};

const ORDER = ['Builder', 'Architect', 'Contractor', 'Distributor'];

export default function Accounts() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);

    // Load accounts with all their contacts in one query
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, name, contacts(id, first_name, last_name, title, company, phone, email, products)')
      .in('name', ['Builder', 'Architect', 'Contractor', 'Distributor']);

    if (error) console.error('Accounts error:', error);

    const sorted = (accounts || []).sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
    setCategories(sorted);
    setLoading(false);
  }

  const active = categories.find(c => c.name === activeCategory);
  const meta = activeCategory ? CATEGORY_META[activeCategory] : null;

  const contacts = active?.contacts || [];
  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.title || ''} ${c.company || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const initials = c => `${c.first_name[0] || ''}${c.last_name[0] || ''}`.toUpperCase();

  // ── Detail View ──────────────────────────────────────────────────
  if (activeCategory && meta) {
    return (
      <div className="page">
        <div className="page-header">
          <button onClick={() => { setActiveCategory(null); setSearch(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 16, cursor: 'pointer', padding: '4px 0', fontWeight: 600, marginBottom: 8 }}>
            {'\u2190'} Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{meta.icon}</span>
            <div>
              <div className="page-title">{activeCategory}</div>
              <div className="page-subtitle">{contacts.length} contacts</div>
            </div>
          </div>
        </div>

        <div className="search-bar">
          <span style={{ color: 'var(--text-secondary)' }}>{'\uD83D\uDD0D'}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeCategory.toLowerCase()}s...`} />
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
                <div className="item-sub">
                  {contact.title || ''}
                  {contact.title && contact.company ? ' \u00b7 ' : ''}
                  {contact.company || ''}
                </div>
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

  // ── Category List ────────────────────────────────────────────────
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
        {categories.map(cat => {
          const m = CATEGORY_META[cat.name] || { icon: '\uD83C\uDFE2', color: 'var(--accent)' };
          return (
            <div
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
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
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {cat.contacts?.length || 0} contacts
                </div>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{'\u203A'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
