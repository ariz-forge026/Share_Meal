import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, UserRound } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';

export default function ProfileSettings() {
  const { user, loading: authLoading, refreshUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/users/me').then(({ data }) => setProfile(data.user)).catch((requestError) => setError(getErrorMessage(requestError)));
  }, [user]);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const hasLatitude = Boolean(payload.latitude);
    const hasLongitude = Boolean(payload.longitude);
    if (hasLatitude !== hasLongitude) {
      setError('Enter both latitude and longitude, or leave both blank.');
      setSaving(false);
      return;
    }
    payload.clearLocation = !hasLatitude;
    for (const field of ['latitude', 'longitude']) {
      if (payload[field]) payload[field] = Number(payload[field]);
      else delete payload[field];
    }
    try {
      const { data } = await api.patch('/users/me', payload);
      setProfile(data.user);
      await refreshUser();
      setNotice('Your profile was updated.');
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setSaving(false); }
  }

  async function changePassword(event) {
    event.preventDefault(); setError(''); setNotice('');
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const { data } = await api.post('/auth/change-password', payload);
      const signedOut = await signOut();
      if (signedOut) navigate('/login', { state: { notice: data.message } });
      else setNotice(`${data.message} Please sign in again.`);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  if (authLoading) return <><PageIntro eyebrow="Account settings" title="Your profile, your details." description="Manage your account information securely." /><section className="section"><div className="container"><StatusMessage>Loading account…</StatusMessage></div></section></>;
  if (!user) return <><PageIntro eyebrow="Account settings" title="Your profile, your details." description="Sign in to manage your ShareMeal account." /><section className="section"><div className="container"><StatusMessage>Please sign in to manage your profile. <Link to="/login">Sign in</Link></StatusMessage></div></section></>;
  const profileData = profile || user;
  return <>
    <PageIntro eyebrow="Account settings" title="Your profile, your details." description="Keep your contact and organization information current. Email and account role are managed securely." />
    <section className="section form-section"><div className="container settings-layout">
      <div className="settings-sidebar"><span className="auth-icon"><UserRound /></span><h2>{profileData.name}</h2><span className="eyebrow">{profileData.role}</span>{profileData.ngoProfile && <p>NGO verification: {profileData.ngoProfile.verificationStatus?.replaceAll('_', ' ')}</p>}</div>
      <div className="settings-forms">
        {error && <StatusMessage variant="error">{error}</StatusMessage>}{notice && <StatusMessage variant="success">{notice}</StatusMessage>}
        <form className="form-grid form-card" onSubmit={saveProfile}><div className="form-card-heading"><h2>Profile information</h2><p>Changes are saved to your ShareMeal account.</p></div><label className="field">Name<input name="name" required minLength="2" maxLength="80" defaultValue={profileData.name} /></label><label className="field">Email<input value={profileData.email} disabled /></label><label className="field">Phone<input name="phone" maxLength="30" defaultValue={profileData.phone || ''} /></label>
          {profileData.role === 'donor' && <><label className="field">Donor type<select name="donorType" defaultValue={profileData.donorProfile?.donorType || 'individual'}><option value="individual">Individual</option><option value="restaurant">Restaurant</option><option value="hotel">Hotel</option><option value="cafe">Cafe</option><option value="caterer">Caterer</option><option value="grocery">Grocery store</option><option value="food_shop">Food shop</option><option value="event_organizer">Event organizer</option><option value="other">Other</option></select></label><label className="field">Business name<input name="businessName" maxLength="120" defaultValue={profileData.donorProfile?.businessName || ''} /></label></>}
          {['donor', 'ngo'].includes(profileData.role) && <><label className="field field-full">Address<input name="address" maxLength="250" defaultValue={profileData.donorProfile?.address || profileData.ngoProfile?.address || ''} /></label><label className="field">City<input name="city" maxLength="80" defaultValue={profileData.donorProfile?.city || profileData.ngoProfile?.city || ''} /></label><div className="field-full location-consent-note">Optional coordinates support nearby search. No browser location is requested here.</div><label className="field">Latitude<input name="latitude" type="number" step="any" min="-90" max="90" defaultValue={profileData.donorProfile?.location?.coordinates?.[1] ?? profileData.ngoProfile?.location?.coordinates?.[1] ?? ''} /></label><label className="field">Longitude<input name="longitude" type="number" step="any" min="-180" max="180" defaultValue={profileData.donorProfile?.location?.coordinates?.[0] ?? profileData.ngoProfile?.location?.coordinates?.[0] ?? ''} /></label></>}
          <div className="field-full form-actions"><span>Account role and email cannot be edited here.</span><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'} <ArrowRight size={15} /></button></div>
        </form>
        <form className="form-grid form-card password-card" onSubmit={changePassword}><div className="form-card-heading"><h2>Change password</h2><p>Changing your password ends this session; sign in again afterward.</p></div><label className="field field-full">Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label><label className="field field-full">New password<input name="newPassword" type="password" autoComplete="new-password" minLength="8" required /></label><div className="field-full form-actions"><span>Use at least 8 characters.</span><button className="button button-outline">Update password</button></div></form>
      </div>
    </div></section>
  </>;
}
