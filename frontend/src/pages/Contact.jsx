import { useState } from 'react';
import { ArrowRight, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import api, { getErrorMessage } from '../services/api.js';

export default function Contact() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setNotice(''); setError(''); setBusy(true);
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const { data } = await api.post('/contact', payload);
      setNotice(data.message);
      form.reset();
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setBusy(false); }
  }
  return <><PageIntro eyebrow="We are listening" title="Let’s talk about sharing." description="Questions about joining, using the platform or building a caring local food network? Send us a message." /><section className="section"><div className="container contact-grid"><article className="contact-card contact-form-card"><span className="contact-icon"><Mail /></span><h2>Send us a note</h2><p>We will keep your message in the ShareMeal support inbox for an administrator to review.</p>{notice && <StatusMessage variant="success">{notice}</StatusMessage>}{error && <StatusMessage variant="error">{error}</StatusMessage>}<form className="auth-form" onSubmit={submit}><label className="field">Your name<input name="name" required minLength="2" maxLength="80" autoComplete="name" /></label><label className="field">Email address<input name="email" type="email" required maxLength="254" autoComplete="email" /></label><label className="field">Message<textarea name="message" rows="4" required minLength="10" maxLength="2000" /></label><button className="button button-primary" disabled={busy}>{busy ? 'Sending…' : 'Send message'} <ArrowRight size={15} /></button></form></article><article className="contact-card"><span className="contact-icon"><MessageCircle /></span><h2>Need a hand?</h2><p>Start by exploring how the platform works, or create an account to get involved.</p><Link className="text-link" to="/how-it-works">Explore the steps <ArrowRight size={16} /></Link></article><article className="contact-card contact-card-green"><span className="contact-icon"><ShieldCheck /></span><h2>Trust matters</h2><p>Organization accounts are not considered verified until an administrator has approved them.</p><Link className="text-link" to="/about">Our approach <ArrowRight size={16} /></Link></article></div></section></>;
}
