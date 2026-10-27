import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileWarning, ShieldCheck } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';

const categories = ['prepared', 'produce', 'packaged', 'bakery', 'other'];

export default function VerificationApplication() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user?.role === 'ngo') api.get('/ngos/my-profile').then(({ data }) => setProfile(data.profile)).catch((requestError) => setError(getErrorMessage(requestError)));
  }, [user]);
  async function submit(event) {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    payload.categoriesAccepted = data.getAll('categoriesAccepted');
    for (const key of ['latitude', 'longitude']) { if (payload[key]) payload[key] = Number(payload[key]); else delete payload[key]; }
    payload.serviceRadiusKm = Number(payload.serviceRadiusKm);
    try {
      const { data: result } = await api.post('/ngos/apply', payload);
      setNotice(`Application submitted. Status: ${result.ngo.verificationStatus}. An administrator must review it.`);
      await refreshUser();
      const { data: updatedProfile } = await api.get('/ngos/my-profile');
      setProfile(updatedProfile.profile);
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  }
  return <>
    <PageIntro eyebrow="Organization review" title="Help us verify your organization." description="Share organization details so an administrator can review your application. Approval is not automatic." />
    <section className="section form-section"><div className="container form-layout">
      <aside className="form-aside"><span className="aside-icon"><ShieldCheck /></span><h2>Trust starts with review.</h2><p>Only organizations approved by an administrator can request or collect donations.</p><div className="aside-note"><FileWarning size={18} /><strong>Documents are not accepted yet.</strong><span>Private document storage has not been configured. Do not upload or email sensitive identity/registration documents to this demo.</span></div>{profile?.verificationStatus && <StatusMessage>Current status: {profile.verificationStatus.replaceAll('_', ' ')}</StatusMessage>}</aside>
      <form className="form-grid form-card" onSubmit={submit}>
        {!user && <div className="field-full"><StatusMessage>Please sign in with an NGO account to submit an application. <Link to="/login">Sign in</Link></StatusMessage></div>}
        {user && user.role !== 'ngo' && <div className="field-full"><StatusMessage variant="error">This application is available to NGO accounts only.</StatusMessage></div>}
        {profile?.verification?.decisionNote && <div className="field-full"><StatusMessage>{profile.verification.decisionNote}</StatusMessage></div>}
        {error && <div className="field-full"><StatusMessage variant="error">{error}</StatusMessage></div>}{notice && <div className="field-full"><StatusMessage variant="success">{notice}</StatusMessage></div>}
        <div className="form-card-heading"><h2>Verification application</h2><p>Fill in accurate, publicly verifiable organization details.</p></div>
        <label className="field field-full">Legal organization name *<input name="legalName" required minLength="2" maxLength="160" defaultValue={profile?.legalName || profile?.organizationName || ''} /></label>
        <label className="field">Registration category *<input name="registrationCategory" required maxLength="80" defaultValue={profile?.registrationCategory || ''} placeholder="e.g. Registered nonprofit" /></label>
        <label className="field">Registration number<input name="registrationNumber" maxLength="100" defaultValue={profile?.registrationNumber || ''} /></label>
        <label className="field field-full">Organization address *<input name="address" required minLength="5" maxLength="250" defaultValue={profile?.address || ''} /></label>
        <label className="field">City *<input name="city" required maxLength="80" defaultValue={profile?.city || ''} /></label>
        <label className="field">Official contact phone<input name="contactPhone" maxLength="30" defaultValue={profile?.contactPhone || ''} /></label>
        <label className="field field-full">About your service area and work *<textarea name="description" rows="4" required minLength="10" maxLength="500" defaultValue={profile?.description || ''} /></label>
        <fieldset className="field-full checkbox-fieldset"><legend>Food categories your organization accepts</legend><div className="category-checkboxes">{categories.map((category) => <label key={category}><input type="checkbox" name="categoriesAccepted" value={category} defaultChecked={profile?.categoriesAccepted?.includes(category)} />{category.replaceAll('_', ' ')}</label>)}</div></fieldset>
        <label className="field">Service radius (km)<input name="serviceRadiusKm" type="number" min="1" max="250" defaultValue={profile?.serviceRadiusKm || 25} /></label>
        <label className="field">Operating hours<input name="operatingHours" maxLength="200" defaultValue={profile?.operatingHours || ''} placeholder="Optional" /></label>
        <div className="field-full location-consent-note">You may optionally provide coordinates manually for nearby search. Address geocoding is not configured.</div>
        <label className="field">Latitude<input name="latitude" type="number" step="any" min="-90" max="90" defaultValue={profile?.location?.coordinates?.[1] ?? ''} /></label>
        <label className="field">Longitude<input name="longitude" type="number" step="any" min="-180" max="180" defaultValue={profile?.location?.coordinates?.[0] ?? ''} /></label>
        {user?.role === 'ngo' && <div className="field-full form-actions"><span>No sensitive documents are uploaded or stored by this version.</span><button className="button button-primary" disabled={saving || profile?.verificationStatus === 'pending' || profile?.verificationStatus === 'approved'}>{saving ? 'Submitting…' : profile?.verificationStatus === 'pending' ? 'Under review' : profile?.verificationStatus === 'approved' ? 'Organization approved' : 'Submit for review'} <ArrowRight size={15} /></button></div>}
      </form>
    </div></section>
  </>;
}
