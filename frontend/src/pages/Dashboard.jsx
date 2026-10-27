import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ClipboardList, HeartHandshake, PackageCheck, ShieldCheck, UsersRound } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/formatDate.js';

const cardIcons = [PackageCheck, HeartHandshake, ClipboardList, UsersRound, BadgeCheck];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (user) {
      api.get('/dashboard').then(({ data }) => { if (active) setDashboard(data); })
        .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
        .finally(() => { if (active) setLoading(false); });
    } else if (!authLoading) {
      setLoading(false);
    }
    return () => { active = false; };
  }, [user, authLoading]);

  const stats = dashboard?.stats ? Object.entries(dashboard.stats) : [];
  const title = user?.role === 'admin' ? 'Platform overview.' : user?.role === 'ngo' ? 'Community work, in motion.' : user?.role === 'volunteer' ? 'Your next good deed.' : 'Your sharing, at a glance.';
  return <>
    <PageIntro eyebrow={user ? `${user.role} dashboard` : 'Your ShareMeal space'} title={title} description="A clear view of current work, using live records from the ShareMeal database." />
    <section className="section"><div className="container">
      {!user && !authLoading && <div className="empty-state"><h2>Sign in to see your dashboard.</h2><p>Your dashboard contains your real donation or collection activity.</p><Link className="button button-primary" to="/login">Sign in <ArrowRight size={15} /></Link></div>}
      {loading && <StatusMessage>Loading live dashboard data…</StatusMessage>}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {dashboard && <>
        {dashboard.verificationStatus && dashboard.verificationStatus !== 'approved' && <StatusMessage>Your NGO verification is {dashboard.verificationStatus.replaceAll('_', ' ')}. You can apply or update your application; collection requests remain disabled until approved.</StatusMessage>}
        <div className="dashboard-stats">{stats.map(([label, value], index) => { const Icon = cardIcons[index % cardIcons.length]; return <article className="dashboard-stat" key={label}><span><Icon size={20} /></span><strong>{value.toLocaleString()}</strong><small>{label.replaceAll(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}{label.includes('Estimate') ? ' · reported estimate' : ''}</small></article>; })}</div>
        <div className="dashboard-actions">{user.role === 'donor' && <><Link className="button button-primary" to="/donate">Create donation <ArrowRight size={15} /></Link><Link className="button button-outline" to="/my-donations">My donations</Link></>}{user.role === 'ngo' && <><Link className="button button-primary" to="/food">Find food <ArrowRight size={15} /></Link><Link className="button button-outline" to="/tasks">Collection management</Link><Link className="button button-outline" to="/ngos/apply">Verification application</Link></>}{user.role === 'volunteer' && <Link className="button button-primary" to="/tasks">View assigned tasks <ArrowRight size={15} /></Link>}{user.role === 'admin' && <><Link className="button button-primary" to="/admin/ngos">Review NGOs <ArrowRight size={15} /></Link><Link className="button button-outline" to="/admin/users">User management</Link></>}</div>
        {dashboard.latest?.length > 0 && <div className="dashboard-latest"><div className="split-heading"><div><span className="eyebrow">Latest activity</span><h2>What’s happening</h2></div><Link className="text-link" to={user.role === 'volunteer' ? '/tasks' : '/my-donations'}>See all <ArrowRight size={15} /></Link></div><div className="table-scroll"><table><thead><tr><th>Activity</th><th>Status</th><th>Location</th><th>Updated</th></tr></thead><tbody>{dashboard.latest.map((item) => { const donation = item.donation || item; return <tr key={item._id}><td><Link to={donation._id ? `/food/${donation._id}` : '/tasks'}>{donation.title || 'Collection task'}</Link></td><td><span className="listing-status">{item.status}</span></td><td>{donation.city || '—'}</td><td>{formatDate(item.updatedAt || item.scheduledAt)}</td></tr>; })}</tbody></table></div></div>}
      </>}
    </div></section>
  </>;
}
