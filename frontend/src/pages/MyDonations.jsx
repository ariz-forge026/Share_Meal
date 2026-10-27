import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, PackageCheck, RefreshCw } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/formatDate.js';

export default function MyDonations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');

  const loadDonations = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/donations/my-donations');
      setDonations(data.donations);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) void loadDonations(); }, [user, loadDonations]);

  async function cancelDonation(id) {
    setCancellingId(id);
    setError('');
    setNotice('');
    try {
      await api.post(`/donations/${id}/cancel`);
      setNotice('Listing cancelled.');
      await loadDonations();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setCancellingId(''); }
  }

  return <>
    <PageIntro eyebrow="Your ShareMeal activity" title="Good things, in motion." description="Check donation progress and review requests or collection details for listings you are authorized to manage." />
    <section className="section listings-section"><div className="container">
      {!user && <div className="empty-state"><h2>Sign in to see your activity.</h2><p>Your food listings and collection progress are available when you are signed in.</p><Link className="button button-primary" to="/login">Sign in <ArrowRight size={16} /></Link></div>}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}{notice && <StatusMessage variant="success">{notice}</StatusMessage>}
      {loading && user && <StatusMessage>Loading your donation activity…</StatusMessage>}
      {user && !loading && donations.length === 0 && <div className="empty-state"><span className="empty-icon"><PackageCheck size={27} /></span><h2>No activity just yet.</h2><p>{user.role === 'donor' ? 'Share your first food listing and local organizations can discover it.' : 'When your organization is involved in a donation, progress will appear here.'}</p><Link className="button button-primary" to={user.role === 'donor' ? '/donate' : '/food'}>{user.role === 'donor' ? 'List food to share' : 'Browse available food'} <ArrowRight size={16} /></Link></div>}
      {user && donations.length > 0 && <div className="listing-grid">{donations.map((donation) => <article className="listing-card" key={donation._id}>
        <div className="listing-card-top"><span className="listing-category">{donation.category}</span><span className={`listing-status status-pill-${donation.status}`}>{donation.status.replaceAll('_', ' ')}</span></div>
        <h2>{donation.title}</h2><p>{donation.description}</p>
        <div className="listing-meta"><span><PackageCheck size={15} /> {donation.quantity} {donation.unit}</span><span><MapPin size={15} /> {donation.city}</span></div>
        <div className="listing-footer">{donation.pickupAddress && <span>Pickup: {donation.pickupAddress}</span>}<span>Collect by {formatDate(donation.expiresAt)}</span>{donation.assignedNgo && <span>NGO: {donation.assignedNgo.ngoProfile?.organizationName || donation.assignedNgo.name}</span>}{donation.distributionNote && <span>Distribution note: {donation.distributionNote}</span>}</div>
        <div className="activity-actions"><Link className="text-link" to={`/food/${donation._id}`}>View details <ArrowRight size={15} /></Link>{user.role === 'donor' && donation.status === 'requested' && <Link className="button button-primary button-small" to={`/food/${donation._id}`}>Review request</Link>}{user.role === 'donor' && donation.status === 'available' && <><Link className="button button-outline button-small" to={`/food/${donation._id}`}>Edit listing</Link><button className="button button-outline button-small" disabled={cancellingId === donation._id} onClick={() => cancelDonation(donation._id)}>{cancellingId === donation._id ? 'Cancelling…' : 'Cancel listing'}</button></>}{user.role === 'ngo' && ['accepted', 'pickup_scheduled', 'collected'].includes(donation.status) && <Link className="button button-outline button-small" to="/tasks">Collection & distribution</Link>}</div>
      </article>)}</div>}
      {user && !loading && <button className="button button-outline refresh-button" onClick={loadDonations}><RefreshCw size={15} /> Refresh activity</button>}
    </div></section>
  </>;
}
