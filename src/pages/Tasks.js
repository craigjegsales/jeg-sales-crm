import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function TaskModal({ task, accounts, contacts, onClose, onSave }) {
  const [form, setForm] = useState(task || {
    title: '', notes: '', due_date: '', account_id: '', contact_id: ''
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    if (task?.id) {
      await supabase.from('tasks').update(form).eq('id', task.id);
    } else {
      await supabase.from('tasks').insert({ ...form, completed: false });
    }
    setSaving(false);
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{task?.id ? 'Edit Task' : 'New Task'}</div>

        <div className="form-group">
          <label className="form-label">Task *</label>
          <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Follow up on Typar quote..." />
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input className="form-input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Account</label>
          <select className="form-select" value={form.account_id} onChange={e => set('account_id', e.target.value)}>
            <option value="">— No Account —</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Contact</label>
          <select className="form-select" value={form.contact_id} onChange={e => set('contact_id', e.target.value)}>
            <option value="">— No Contact —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Additional details..." style={{ resize: 'vertical' }} />
        </div>

        <button className="btn-primary" onClick={save} disabled={saving || !form.title}>
          {saving ? 'Saving...' : 'Save Task'}
        </button>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [t, a, c] = await Promise.all([
      supabase.from('tasks').select('*, accounts(name), contacts(first_name,last_name)').order('due_date').order('created_at', { ascending: false }),
      supabase.from('accounts').select('id,name').order('name'),
      supabase.from('contacts').select('id,first_name,last_name').order('last_name')
    ]);
    setTasks(t.data || []);
    setAccounts(a.data || []);
    setContacts(c.data || []);
  }

  async function toggleComplete(task) {
    await supabase.from('tasks').update({
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : null
    }).eq('id', task.id);
    load();
  }

  const today = new Date().toISOString().split('T')[0];
  const open = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);

  const isOverdue = (t) => t.due_date && t.due_date < today && !t.completed;
  const isDueToday = (t) => t.due_date === today;

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Tasks</div>
        <div className="page-subtitle">{open.length} open · {done.length} completed</div>
      </div>

      {open.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>All caught up!</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>No open tasks</div>
        </div>
      )}

      {open.map(task => (
        <div key={task.id} className="card" style={{ borderColor: isOverdue(task) ? 'rgba(239,68,68,0.4)' : isDueToday(task) ? 'rgba(245,158,11,0.4)' : 'var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <button onClick={() => toggleComplete(task)} style={{
              width: 24, height: 24, borderRadius: 6, border: '2px solid var(--border)',
              background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1
            }} />
            <div style={{ flex: 1 }} onClick={() => { setSelected(task); setShowModal(true); }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</div>
              {(task.accounts?.name || task.contacts) && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {task.accounts?.name}
                  {task.contacts && ` · ${task.contacts.first_name} ${task.contacts.last_name}`}
                </div>
              )}
              {task.due_date && (
                <div style={{ fontSize: 12, marginTop: 4, color: isOverdue(task) ? 'var(--danger)' : isDueToday(task) ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: isOverdue(task) || isDueToday(task) ? 600 : 400 }}>
                  {isOverdue(task) ? '⚠ Overdue · ' : isDueToday(task) ? '📅 Today · ' : '📅 '}{formatDate(task.due_date)}
                </div>
              )}
              {task.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{task.notes}</div>}
            </div>
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <div
            className="section-label"
            onClick={() => setShowCompleted(!showCompleted)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {showCompleted ? '▼' : '▶'} Completed ({done.length})
          </div>
          {showCompleted && done.slice(0, 20).map(task => (
            <div key={task.id} className="card" style={{ opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => toggleComplete(task)} style={{
                  width: 24, height: 24, borderRadius: 6, border: '2px solid var(--success)',
                  background: 'var(--success)', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14
                }}>✓</button>
                <div style={{ textDecoration: 'line-through', fontSize: 14, color: 'var(--text-secondary)' }}>{task.title}</div>
              </div>
            </div>
          ))}
        </>
      )}

      <button className="fab" onClick={() => { setSelected(null); setShowModal(true); }}>+</button>

      {showModal && (
        <TaskModal
          task={selected}
          accounts={accounts}
          contacts={contacts}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={() => { setShowModal(false); setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
