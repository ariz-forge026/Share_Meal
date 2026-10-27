import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';

export default function AdminNgos() {
  const { user } = useAuth();
  const [ngos, setNgos] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [decisionNote, setDecisionNote] = useState('');

  const loadNgos = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/admin/ngos');
      setNgos(data.ngos);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') void loadNgos();
  }, [user, loadNgos]);

  async function setVerification(ngo, status) {
    setBusyId(ngo._id);
    setError('');
    setNotice('');
    try {
      const { data } = await api.patch(`/admin/ngos/${ngo._id}/verification`, { status, decisionNote });
      setNgos((current) => current.map((item) => item._id === ngo._id ? { ...item, ngoProfile: { ...item.ngoProfile, verificationStatus: data.ngo.verificationStatus } } : item));
      setNotice(`${ngo.ngoProfile.organizationName} is now ${data.ngo.verificationStatus.replaceAll('_', ' ')}.`);
      setDecisionNote('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId('');
    }
  }

  return (
    <>
      <PageIntro eyebrow="Administrator workspace" title="Review community organizations." description="Check organization details before approving food requests. Only administrator-approved NGOs can request or collect donations." />
      <section className="section listings-section"><div className="container">
        {!user && <StatusMessage>Please sign in with an administrator account to review NGO registrations.</StatusMessage>}
        {user && user.role !== 'admin' && <StatusMessage variant="error">This page is available to administrators only.</StatusMessage>}
        {user?.role === 'admin' && error && <StatusMessage variant="error">{error}</StatusMessage>}
        {user?.role === 'admin' && notice && <StatusMessage variant="success">{notice}</StatusMessage>}
        {user?.role === 'admin' && loading && <StatusMessage>Loading organization registrations…</StatusMessage>}
        {user?.role === 'admin' && !loading && !error && ngos.length === 0 && <div className="empty-state"><span className="empty-icon"><ShieldCheck size={27} /></span><h2>No organizations to review.</h2><p>New NGO registrations will appear here after MongoDB is configured.</p></div>}
        {user?.role === 'admin' && !loading && ngos.length > 0 && <div className="listing-grid">{ngos.map((ngo) => <article className="listing-card review-card" key={ngo._id}>
          <div className="listing-card-top"><span className="listing-category">NGO registration</span><span className={`listing-status ${ngo.ngoProfile.verificationStatus === 'approved' ? '' : 'status-pill-requested'}`}>{ngo.ngoProfile.verificationStatus?.replaceAll('_', ' ')}</span></div>
          <h2>{ngo.ngoProfile.organizationName || ngo.ngoProfile.legalName || 'Organization registration'}</h2><p>{ngo.ngoProfile.description || 'No organization description was provided.'}</p>
          <div className="listing-footer review-details"><span><UserRound size={14} /> {ngo.name} · {ngo.email}</span><span>{ngo.ngoProfile.legalName && `Legal name: ${ngo.ngoProfile.legalName}`}</span><span>Registration: {ngo.ngoProfile.registrationCategory || 'Not provided'} · {ngo.ngoProfile.registrationNumber || 'No number provided'}</span><span><MapPin size={14} /> {ngo.ngoProfile.address}, {ngo.ngoProfile.city}</span><span>Categories: {ngo.ngoProfile.categoriesAccepted?.join(', ') || 'None specified'}</span><span>Decision note: {ngo.ngoProfile.verification?.decisionNote || 'None'}</span></div>
          {ngo.ngoProfile.verificationStatus === 'pending' && <><label className="field admin-note-field">Decision note (optional)<textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} maxLength="500" rows="2" placeholder="Explain the review decision or missing information." /></label><div className="admin-review-actions"><button className="button button-primary button-small" disabled={busyId === ngo._id} onClick={() => setVerification(ngo, 'approved')}>Approve</button><button className="button button-outline button-small" disabled={busyId === ngo._id} onClick={() => setVerification(ngo, 'rejected')}>Reject</button><button className="button button-outline button-small" disabled={busyId === ngo._id} onClick={() => setVerification(ngo, 'needs_more_information')}>Request information</button></div></>}
        </article>)}</div>}
      </div></section>
    </>
  );
}
