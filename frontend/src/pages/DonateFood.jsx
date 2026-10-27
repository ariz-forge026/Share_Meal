import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';

export default function DonateFood() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.allergens = String(payload.allergens || '').split(',').map((allergen) => allergen.trim()).filter(Boolean);
    for (const field of ['peopleServedEstimate', 'preparedAt', 'useBy', 'storageRequirements', 'handlingInstructions']) {
      if (!payload[field]) delete payload[field];
    }
    if (payload.peopleServedEstimate) payload.peopleServedEstimate = Number(payload.peopleServedEstimate);
    for (const field of ['preparedAt', 'useBy']) {
      if (payload[field]) payload[field] = new Date(payload[field]).toISOString();
    }
    for (const field of ['latitude', 'longitude']) {
      if (payload[field]) payload[field] = Number(payload[field]);
      else delete payload[field];
    }
    if (payload.latitude === undefined !== (payload.longitude === undefined)) {
      setMessage('Enter both latitude and longitude, or leave both blank.');
      setBusy(false);
      return;
    }
    try {
      await api.post('/donations', { ...payload, quantity: Number(payload.quantity), expiresAt: new Date(payload.expiresAt).toISOString() });
      navigate('/food', { state: { notice: 'Your food listing is now available to nearby verified NGOs.' } });
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="Share a little extra" title="Good food, meet good neighbors." description="Tell local organizations what you have and when it can be collected." />
      <section className="section form-section"><div className="container form-layout"><div className="form-aside"><span className="aside-icon"><ShieldCheck /></span><h2>A few details make a big difference.</h2><p>Be clear about quantity, ingredients and pickup timing so an organization can decide if it is a good fit.</p><div className="aside-note"><strong>Food safety first</strong><span>Only list food that is safe, wholesome and handled appropriately.</span></div></div>
        <div className="form-card">{!user ? <div className="form-gate"><h2>Sign in to list food</h2><p>Create a donor account or sign in to share a listing with nearby NGOs.</p><Link to="/login" className="button button-primary">Sign in to continue <ArrowRight size={16} /></Link><Link to="/register">New to ShareMeal? Create an account</Link></div> : user.role !== 'donor' ? <div className="form-gate"><h2>Donor accounts create listings</h2><p>Your current account is registered as {user.role}. Sign in with a donor account to create a food listing.</p></div> : <form className="form-grid" onSubmit={submit}>
          <div className="form-card-heading"><h2>Food listing</h2><p>Fields marked <span aria-hidden="true">*</span> are required.</p></div>
          <label className="field field-full">Listing title *<input name="title" required minLength="3" maxLength="100" placeholder="e.g. Fresh vegetable lunch boxes" /></label>
          <label className="field field-full">Description *<textarea name="description" required minLength="10" maxLength="1000" rows="4" placeholder="What is included? Mention ingredients, allergens or packaging." /></label>
          <label className="field">Category *<select name="category" required defaultValue=""><option value="" disabled>Select a category</option><option value="prepared">Prepared food</option><option value="produce">Fresh produce</option><option value="packaged">Packaged food</option><option value="bakery">Bakery</option><option value="other">Other</option></select></label>
          <label className="field">Quantity *<input name="quantity" required type="number" min="0.01" step="any" max="10000" placeholder="e.g. 20" /></label>
          <label className="field">Unit *<select name="unit" required defaultValue=""><option value="" disabled>Select a unit</option><option value="portions">Portions</option><option value="kg">Kilograms</option><option value="boxes">Boxes</option><option value="items">Items</option></select></label>
          <label className="field">City *<input name="city" required maxLength="80" placeholder="Your city" /></label>
          <label className="field field-full">Pickup address *<input name="pickupAddress" required maxLength="250" placeholder="Street address or clear pickup location" /></label>
          <label className="field field-full">Collect before *<input name="expiresAt" required type="datetime-local" min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} /></label>
          <label className="field">Food type<select name="foodType" defaultValue="unknown"><option value="unknown">Not specified</option><option value="vegetarian">Vegetarian</option><option value="non_vegetarian">Non-vegetarian</option><option value="vegan">Vegan</option></select></label>
          <label className="field">Estimated portions<input name="peopleServedEstimate" type="number" min="0" max="100000" placeholder="Optional estimate" /></label>
          <label className="field">Prepared or packed at<input name="preparedAt" type="datetime-local" /></label>
          <label className="field">Use by<input name="useBy" type="datetime-local" /></label>
          <label className="field field-full">Storage requirements<input name="storageRequirements" maxLength="300" placeholder="e.g. Keep refrigerated; do not break cold chain" /></label>
          <label className="field field-full">Known allergens<input name="allergens" maxLength="300" placeholder="Comma-separated where known (for example: peanuts, dairy)" /></label>
          <label className="field">Packaging condition<select name="packagingCondition" defaultValue="not_applicable"><option value="not_applicable">Not applicable</option><option value="sealed">Sealed</option><option value="intact">Intact</option><option value="needs_review">Needs review at pickup</option></select></label>
          <label className="field field-full">Handling instructions<textarea name="handlingInstructions" maxLength="500" rows="2" placeholder="Optional handoff or handling notes." /></label>
          <p className="field-full location-consent-note">Optional location coordinates let nearby organizations calculate distance. You can enter them manually; no browser location is requested without your permission.</p>
          <label className="field">Latitude<input name="latitude" type="number" min="-90" max="90" step="any" placeholder="Optional" /></label>
          <label className="field">Longitude<input name="longitude" type="number" min="-180" max="180" step="any" placeholder="Optional" /></label>
          {message && <div className="field-full"><StatusMessage variant="error">{message}</StatusMessage></div>}
          <div className="field-full form-actions"><span>Only verified NGOs can request your listing.</span><button className="button button-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish listing'} <ArrowRight size={16} /></button></div>
        </form>}</div>
      </div></section>
    </>
  );
}
