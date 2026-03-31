import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ contacts: 0, accounts: 0, tasks: 0, opportunities: 0 });
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const uid = currentUser.id;

    const [contacts, accounts, tasks, opps, overdue, activity] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('completed', false).eq('user_id', uid),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('user_id', uid).not('stage', 'in', '("Closed Won","Closed Lost")'),
      supabase.from('tasks').select('*, contacts(first_name,last_name), accounts(name)').eq('completed', false).eq('user_id', uid).lt('due_date', today).order('due_date').limit(5),
      supabase.from('activities').select('*, contacts(first_name,last_name), accounts(name)').eq('user_id', uid).order('created_at', { ascending: false }).limit(5)
    ]);

    setStats({
      contacts: contacts.count || 0,
      accounts: accounts.count || 0,
      tasks: tasks.count || 0,
      opportunities: opps.count || 0
    });
    setOverdueTasks(overdue.data || []);
    setRecentActivity(activity.data || []);
    setLoading(false);
  }

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/JEG-Icon.png" alt="JEG" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <div className="page-title">Dashboard</div>
              <div className="page-subtitle">Welcome back, {user?.email?.split('@')[0]}</div>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px', color: 'var(--text-secondary)',
            fontSize: 12, cursor: 'pointer'
          }}>Sign Out</button>
        </div>
      </div>
      <div className="stats-grid" style={{ marginTop: 12 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.contacts}</div>
          <div className="stat-label">Contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.accounts}</div>
          <div className="stat-label">Accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: stats.tasks > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{stats.tasks}</div>
          <div className="stat-label">Open Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--nanawall)' }}>{stats.opportunities}</div>
          <div className="stat-label">Pipeline</div>
        </div>
      </div>
      {overdueTasks.length > 0 && (
        <>
          <div className="section-label" style={{ color: 'var(--danger)' }}>Overdue Tasks</div>
          {overdueTasks.map(task => (
            <div className="card" key={task.id} style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</div>
              <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                Due {formatDate(task.due_date)} - {task.contacts ? `${task.contacts.first_name} ${task.contacts.last_name}` : task.accounts?.name || ''}
              </div>
            </div>
          ))}
        </>
      )}
      {recentActivity.length > 0 && (
        <>
          <div className="section-label">Recent Activity</div>
          {recentActivity.map(act => (
            <div className="card" key={act.id}>
              <div className="card-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{act.subject}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                    {act.contacts ? `${act.contacts.first_name} ${act.contacts.last_name}` : act.accounts?.name || ''}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{act.type}</div>
              </div>
            </div>
          ))}
        </>
      )}
      {!loading && recentActivity.length === 0 && overdueTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Let us get started</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Add your first account or contact to begin</div>
        </div>
      )}
    </div>
  );
}
