import { useCallback, useEffect, useState } from 'react';
import { Activity, ChartNoAxesCombined, MailCheck, ShieldCheck } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';

export default function AdminReports() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [logs, setLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [dashboardResult, logsResult, messagesResult] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/audit-logs', { params: { limit: 20 } }),
        api.get('/admin/contact-messages', { params: { limit: 20, status: 'new' } }),
      ]);
      setDashboard(dashboardResult.data.stats);
      setLogs(logsResult.data.logs);
      setMessages(messagesResult.data.messages);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }, []);
  useEffect(() => { if (user?.role === 'admin') void load(); }, [user, load]);

  async function reviewMessage(message, status) {
    try {
      await api.patch(`/admin/contact-messages/${message._id}`, { status });
      setNotice(`Message marked ${status}.`);
      await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }
  return <>
    <PageIntro eyebrow="Administrator reports" title="A clear view of platform activity." description="Statistics come from current database records; recipient totals are reported estimates, not verified impact." />
    <section className="section"><div className="container">
      {user?.role !== 'admin' && <StatusMessage variant="error">Administrator access is required.</StatusMessage>}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}{notice && <StatusMessage variant="success">{notice}</StatusMessage>}
      {dashboard && <div className="dashboard-stats">{Object.entries(dashboard).map(([key, value], index) => { const Icon = [ChartNoAxesCombined, ShieldCheck, Activity, MailCheck][index % 4]; return <article className="dashboard-stat" key={key}><span><Icon size={20} /></span><strong>{Number(value).toLocaleString()}</strong><small>{key.replaceAll(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}{key.includes('Recipients') ? ' · reported estimate' : ''}</small></article>; })}</div>}
      <div className="admin-report-grid">
        <section className="admin-report-section"><div className="split-heading"><div><span className="eyebrow">Support inbox</span><h2>New contact messages</h2></div></div>{messages.length === 0 && <p className="muted-caption">No new messages.</p>}{messages.map((message) => <article className="admin-message" key={message._id}><strong>{message.name}</strong><a href={`mailto:${message.email}`}>{message.email}</a><p>{message.message}</p><time>{new Date(message.createdAt).toLocaleString()}</time><button className="button button-outline button-small" onClick={() => reviewMessage(message, 'reviewed')}>Mark reviewed</button></article>)}</section>
        <section className="admin-report-section"><div className="split-heading"><div><span className="eyebrow">Audit log</span><h2>Recent administrative actions</h2></div></div>{logs.length === 0 && <p className="muted-caption">No audit entries yet.</p>}{logs.map((log) => <article className="admin-audit-item" key={log._id}><span className="history-dot" /><div><strong>{log.action.replaceAll('.', ' ')}</strong><p>{log.resourceType} · {log.actor?.name || 'System'} · {new Date(log.createdAt).toLocaleString()}</p></div></article>)}</section>
      </div>
    </div></section>
  </>;
}
