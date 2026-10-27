import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, ClipboardList, MapPin, PackageCheck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/formatDate.js';

export default function CollectionTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [acceptedDonations, setAcceptedDonations] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [volunteerNotice, setVolunteerNotice] = useState('');

  const load = useCallback(async () => {
    if (!user || !['ngo', 'volunteer'].includes(user.role)) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      const { data } = await api.get('/collection-tasks/my-tasks');
      setTasks(data.tasks);
      if (user.role === 'ngo') {
        const [volunteerResult, donationResult] = await Promise.all([
          api.get('/ngos/volunteers'),
          api.get('/donations/my-donations', { params: { status: 'accepted', limit: 50 } }),
        ]);
        setVolunteers(volunteerResult.data.volunteers);
        setAcceptedDonations(donationResult.data.donations);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function schedule(event, donation) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(donation._id); setError(''); setNotice('');
    try {
      await api.post('/collection-tasks', { donationId: donation._id, volunteerId: form.volunteerId, scheduledAt: new Date(form.scheduledAt).toISOString() });
      setNotice(`Collection scheduled for ${donation.title}.`);
      await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setBusy(''); }
  }

  async function confirmCollection(task) {
    setBusy(task._id); setError(''); setNotice('');
    try {
      await api.patch(`/collection-tasks/${task._id}`, { status: 'collected', confirmationNote: 'Collection confirmed by assigned volunteer.' });
      setNotice('Collection recorded.');
      await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setBusy(''); }
  }

  async function createVolunteer(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setError(''); setVolunteerNotice('');
    try {
      await api.post('/ngos/volunteers', payload);
      form.reset();
      setVolunteerNotice('Volunteer account created. Share the temporary sign-in details directly and ask the volunteer to change the password.');
      await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  async function recordDistribution(task) {
    const data = distribution[task.donation._id] || {};
    if (!data.quantityDistributed || data.recipientsEstimate === undefined) {
      setError('Enter the distributed quantity and a reported recipient estimate.');
      return;
    }
    setBusy(task._id); setError(''); setNotice('');
    try {
      await api.post(`/donations/${task.donation._id}/distribution`, {
        quantityDistributed: Number(data.quantityDistributed),
        recipientsEstimate: Number(data.recipientsEstimate),
        notes: data.notes || '',
      });
      setNotice('Distribution record saved. Recipient counts are reported estimates.');
      await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setBusy(''); }
  }

  return <>
    <PageIntro eyebrow="Collection & distribution" title={user?.role === 'volunteer' ? 'Your assigned collection tasks.' : 'Make the handoff happen.'} description="Collection records and distribution notes are created by the people authorized to handle each step." />
    <section className="section listings-section"><div className="container">
      {user?.role === 'ngo' && user.ngoProfile?.verificationStatus !== 'approved' && <StatusMessage>Only administrator-approved NGOs can schedule collection or assign volunteers.</StatusMessage>}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}{notice && <StatusMessage variant="success">{notice}</StatusMessage>}
      {volunteerNotice && <StatusMessage variant="success">{volunteerNotice}</StatusMessage>}
      {loading && <StatusMessage>Loading collection tasks…</StatusMessage>}
      {user?.role === 'ngo' && user.ngoProfile?.verificationStatus === 'approved' && <form className="volunteer-form form-card" onSubmit={createVolunteer}><div className="form-card-heading"><h2>Volunteer access</h2><p>Create a volunteer login so your team can confirm assigned pickups. Give the initial password to the volunteer privately.</p></div><div className="volunteer-form-fields"><label className="field">Volunteer name<input name="name" required minLength="2" maxLength="80" /></label><label className="field">Volunteer email<input name="email" type="email" required maxLength="254" /></label><label className="field">Initial password<input name="password" type="password" required minLength="12" autoComplete="new-password" /><span className="field-hint">At least 12 characters. Share privately.</span></label><button className="button button-outline">Create volunteer account</button></div></form>}
      {!loading && user?.role === 'ngo' && user.ngoProfile?.verificationStatus === 'approved' && acceptedDonations.length > 0 && <div className="task-scheduling"><div><span className="eyebrow">Accepted donations</span><h2>Schedule a volunteer pickup</h2></div>{acceptedDonations.map((donation) => <form className="schedule-card" key={donation._id} onSubmit={(event) => schedule(event, donation)}><strong>{donation.title}</strong><span>{donation.quantity} {donation.unit} · {donation.city} · collect by {formatDate(donation.expiresAt)}</span><label className="field">Assigned volunteer<select name="volunteerId" required defaultValue=""><option value="" disabled>Choose an active volunteer</option>{volunteers.map((volunteer) => <option value={volunteer._id} key={volunteer._id}>{volunteer.name} ({volunteer.email})</option>)}</select></label><label className="field">Collection time<input name="scheduledAt" required type="datetime-local" /></label><button className="button button-primary" disabled={busy === donation._id || !volunteers.length}>{!volunteers.length ? 'Add a volunteer first' : busy === donation._id ? 'Scheduling…' : 'Schedule collection'} <ArrowRight size={15} /></button></form>)}</div>}
      {!loading && user?.role === 'ngo' && user.ngoProfile?.verificationStatus === 'approved' && volunteers.length === 0 && <div className="empty-state"><span className="empty-icon"><UsersRound size={27} /></span><h2>Set up your volunteer team.</h2><p>Create an active volunteer account before scheduling collection tasks.</p><Link className="button button-outline" to="/profile">Review your organization profile</Link></div>}
      {!loading && tasks.length === 0 && acceptedDonations.length === 0 && <div className="empty-state"><span className="empty-icon"><ClipboardList size={27} /></span><h2>No collection tasks yet.</h2><p>{user?.role === 'volunteer' ? 'When your NGO assigns you a collection, it will appear here.' : 'When a donor accepts an NGO request, an organization can schedule the collection here.'}</p></div>}
      {!loading && tasks.length > 0 && <div className="listing-grid">{tasks.map((task) => <article className="listing-card" key={task._id}><div className="listing-card-top"><span className="listing-category">Collection task</span><span className="listing-status">{task.status}</span></div><h2>{task.donation.title}</h2><p>{task.donation.quantity} {task.donation.unit} · {task.donation.city}</p><div className="listing-meta"><span><MapPin size={15} /> {task.donation.pickupAddress}</span><span><PackageCheck size={15} /> Collect by {formatDate(task.donation.expiresAt)}</span></div><div className="listing-footer"><span>Scheduled {formatDate(task.scheduledAt)}</span><span>{user.role === 'ngo' ? `Volunteer: ${task.volunteer.name}` : `Organization: ${task.ngo.ngoProfile?.organizationName || task.ngo.name}`}</span></div>{user.role === 'volunteer' && task.status === 'scheduled' && <button className="button button-primary listing-request" disabled={busy === task._id} onClick={() => confirmCollection(task)}>{busy === task._id ? 'Saving…' : 'Confirm pickup'} <BadgeCheck size={15} /></button>}{user.role === 'ngo' && task.status === 'collected' && <div className="distribution-form"><h3>Record distribution</h3><label className="field">Quantity distributed<input type="number" min="0" max={task.donation.quantity} value={distribution[task.donation._id]?.quantityDistributed || ''} onChange={(event) => setDistribution((current) => ({ ...current, [task.donation._id]: { ...current[task.donation._id], quantityDistributed: event.target.value } }))} /></label><label className="field">Estimated recipients<input type="number" min="0" max="100000" value={distribution[task.donation._id]?.recipientsEstimate ?? ''} onChange={(event) => setDistribution((current) => ({ ...current, [task.donation._id]: { ...current[task.donation._id], recipientsEstimate: event.target.value } }))} /></label><label className="field">Notes<textarea rows="2" maxLength="500" value={distribution[task.donation._id]?.notes || ''} onChange={(event) => setDistribution((current) => ({ ...current, [task.donation._id]: { ...current[task.donation._id], notes: event.target.value } }))} /></label><small>Recipients are a reported estimate, not independently verified.</small><button className="button button-primary" disabled={busy === task._id} onClick={() => recordDistribution(task)}>{busy === task._id ? 'Saving…' : 'Record distribution'} <ArrowRight size={15} /></button></div>}</article>)}</div>}
    </div></section>
  </>;
}
