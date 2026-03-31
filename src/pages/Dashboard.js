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
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Let's get started</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Add your first account or contact to begin</div>
        </div>
      )}
    </div>
  );
}
