import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, MapPin, PackageCheck, ShieldCheck } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/formatDate.js';

export default function DonationDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [donation, setDonation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [reviewingId, setReviewingId] = useState('');

  const loadDonation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/donations/${id}`);
      setDonation(data.donation);
      if (user?.role === 'donor' && data.donation.donor?._id === user.id) {
        const requestData = await api.get(`/donations/${id}/requests`);
        setRequests(requestData.data.requests);
      } else {
        setRequests([]);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { void loadDonation(); }, [loadDonation]);

  async function requestDonation() {
    setRequesting(true);
    setError('');
    setNotice('');
    try {
      await api.post(`/donations/${id}/requests`, { message: 'We would like to coordinate a suitable collection.' });
      setNotice('Request submitted. The donor will review it before confirming collection.');
      await loadDonation();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setRequesting(false);
    }
  }

  async function reviewRequest(requestId, status) {
    setReviewingId(requestId);
    setError('');
    setNotice('');
    try {
      await api.patch(`/donation-requests/${requestId}`, { status });
      setNotice(status === 'accepted' ? 'Organization accepted. Coordinate a collection time next.' : 'Request declined; the listing is available to other organizations again.');
      await loadDonation();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setReviewingId('');
    }
  }

  async function updateDonation(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api.patch(`/donations/${id}`, {
        ...form,
        quantity: Number(form.quantity),
        expiresAt: new Date(form.expiresAt).toISOString(),
      });
      setEditing(false);
      setNotice('Your listing was updated.');
      await loadDonation();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="Donation details" title={donation?.title || 'Food listing'} description="Review the food and handoff information before taking the next step." />
      <section className="section"><div className="container">
        <Link className="text-link back-link" to="/food"><ArrowLeft size={15} /> Back to available food</Link>
        {loading && <StatusMessage>Loading donation details…</StatusMessage>}
        {!loading && error && <StatusMessage variant="error">{error}</StatusMessage>}
        {!loading && donation && <div className="detail-layout">
          <article className="detail-card">
            <div className="listing-card-top"><span className="listing-category">{donation.category}</span><span className="listing-status">{donation.status.replaceAll('_', ' ')}</span></div>
            <h2>{donation.title}</h2><p className="detail-description">{donation.description}</p>
            <div className="detail-facts"><span><PackageCheck /> {donation.quantity} {donation.unit}</span><span><MapPin /> {donation.city}</span><span><Clock3 /> Collect by {formatDate(donation.expiresAt)}</span><span><BadgeCheck /> {donation.foodType.replaceAll('_', ' ')}</span>{donation.peopleServedEstimate > 0 && <span>Estimated portions: {donation.peopleServedEstimate} (donor reported)</span>}</div>
            <div className="safety-details"><h3>Handling information shared by the donor</h3><p><strong>Prepared:</strong> {donation.preparedAt ? formatDate(donation.preparedAt) : 'Not specified'}</p><p><strong>Use by:</strong> {donation.useBy ? formatDate(donation.useBy) : 'Not specified'}</p><p><strong>Storage:</strong> {donation.storageRequirements || 'Not specified'}</p><p><strong>Packaging:</strong> {donation.packagingCondition.replaceAll('_', ' ')}</p><p><strong>Known allergens:</strong> {donation.allergens?.join(', ') || 'Not specified'}</p><p><strong>Handling notes:</strong> {donation.handlingInstructions || 'None provided'}</p><small>These details are supplied by the donor and do not certify food safety. Verify at handoff.</small></div>
            {donation.pickupAddress && <div className="private-pickup"><ShieldCheck size={18} /><span><strong>Private pickup location</strong><br />{donation.pickupAddress}</span></div>}
            {donation.history?.length > 0 && <div className="history-list"><h3>Donation history</h3>{donation.history.map((item, index) => <div key={`${item.status}-${item.changedAt}-${index}`}><span className="history-dot" /><span><strong>{item.status.replaceAll('_', ' ')}</strong><small>{new Date(item.changedAt).toLocaleString()} {item.note && ` · ${item.note}`}</small></span></div>)}</div>}
          </article>
          <aside className="detail-aside">
            {notice && <StatusMessage variant="success">{notice}</StatusMessage>}
            {user?.role === 'donor' && donation.donor?._id === user.id && donation.status === 'available' && <div className="detail-action">
              <h3>Your listing</h3>
              <p>You can update or cancel this listing while it is available.</p>
              <button className="button button-outline" onClick={() => setEditing((current) => !current)}>{editing ? 'Close editor' : 'Edit listing'}</button>
              {editing && <form className="form-grid donation-edit-form" onSubmit={updateDonation}>
                <label className="field field-full">Listing title<input name="title" required minLength="3" maxLength="100" defaultValue={donation.title} /></label>
                <label className="field field-full">Description<textarea name="description" required minLength="10" maxLength="1000" rows="3" defaultValue={donation.description} /></label>
                <label className="field">Category<select name="category" required defaultValue={donation.category}><option value="prepared">Prepared food</option><option value="produce">Fresh produce</option><option value="packaged">Packaged food</option><option value="bakery">Bakery</option><option value="other">Other</option></select></label>
                <label className="field">Quantity<input name="quantity" type="number" min="0.01" step="any" max="10000" required defaultValue={donation.quantity} /></label>
                <label className="field">Unit<select name="unit" required defaultValue={donation.unit}><option value="portions">Portions</option><option value="kg">Kilograms</option><option value="boxes">Boxes</option><option value="items">Items</option></select></label>
                <label className="field">City<input name="city" required minLength="2" maxLength="80" defaultValue={donation.city} /></label>
                <label className="field field-full">Pickup address<input name="pickupAddress" required minLength="5" maxLength="250" defaultValue={donation.pickupAddress} /></label>
                <label className="field field-full">Collect before<input name="expiresAt" type="datetime-local" required min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} defaultValue={new Date(new Date(donation.expiresAt).getTime() - new Date(donation.expiresAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16)} /></label>
                <button className="button button-primary field-full" disabled={saving}>{saving ? 'Saving…' : 'Save changes'} <ArrowRight size={15} /></button>
              </form>}
            </div>}
            {!user && <div className="detail-action"><h3>Ready to take part?</h3><p>Sign in as a verified organization to request this donation.</p><Link className="button button-primary" to="/login">Sign in <ArrowRight size={15} /></Link></div>}
            {user?.role === 'ngo' && user.ngoProfile?.verificationStatus !== 'approved' && <StatusMessage>Only administrator-approved NGOs can request this donation.</StatusMessage>}
            {user?.role === 'ngo' && user.ngoProfile?.verificationStatus === 'approved' && donation.status === 'available' && <div className="detail-action"><h3>A good fit?</h3><p>Your request goes to the donor for confirmation. Collection is scheduled afterward.</p><button className="button button-primary" disabled={requesting} onClick={requestDonation}>{requesting ? 'Requesting…' : 'Request donation'} <ArrowRight size={15} /></button></div>}
            {user?.role === 'donor' && donation.donor?._id === user.id && <div className="detail-action"><h3>Organization requests</h3><p>Review incoming requests before collection is confirmed.</p>{requests.length === 0 && <span className="muted-caption">No requests yet.</span>}{requests.map((request) => <article className="request-item" key={request._id}><strong>{request.ngo?.ngoProfile?.organizationName}</strong><p>{request.message || 'No message provided.'}</p><span className="request-status">{request.status}</span>{request.status === 'pending' && <div className="request-actions"><button className="button button-primary button-small" disabled={reviewingId === request._id} onClick={() => reviewRequest(request._id, 'accepted')}>{reviewingId === request._id ? 'Saving…' : 'Accept'}</button><button className="button button-outline button-small" disabled={reviewingId === request._id} onClick={() => reviewRequest(request._id, 'rejected')}>Decline</button></div>}</article>)}{donation.status === 'accepted' && <Link className="button button-outline task-link" to="/my-donations">View next steps <ArrowRight size={15} /></Link>}</div>}
            {user?.role === 'ngo' && donation.assignedNgo?._id === user.id && donation.status === 'accepted' && <div className="detail-action"><h3>Plan the collection</h3><p>Assign a volunteer and confirm a pickup time from your collection dashboard.</p><Link className="button button-primary" to="/tasks">Manage collection <ArrowRight size={15} /></Link></div>}
          </aside>
        </div>}
      </div></section>
    </>
  );
}
