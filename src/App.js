import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Accounts from './pages/Accounts';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Activities from './pages/Activities';
import './styles.css';

const NAV = [
  { key: 'dashboard', label: 'Home', icon: '⊞' },
  { key: 'contacts', label: 'Contacts', icon: '👤' },
  { key: 'accounts', label: 'Accounts', icon: '🏢' },
  { key: 'pipeline', label: 'Pipeline', icon: '📊' },
  { key: 'tasks', label: 'Tasks', icon: '✅' },
  { key: 'activity', label: 'Activity', icon: '📋' },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1923' }}>
        <div style={{ color: '#2e7df7', fontSize: 24, fontWeight: 800 }}>JEG CRM</div>
      </div>
    );
  }

  if (!session) return <Auth />;

  const pages = {
    dashboard: <Dashboard user={session.user} />,
    contacts: <Contacts />,
    accounts: <Accounts />,
    pipeline: <Pipeline />,
    tasks: <Tasks />,
    activity: <Activities />,
  };

  return (
    <div className="app-container">
      {pages[tab]}

      <nav className="bottom-nav">
        {NAV.map(item => (
          <button key={item.key} className={`nav-item ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
