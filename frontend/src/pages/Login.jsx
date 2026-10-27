import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, HeartHandshake } from 'lucide-react';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../services/api.js';

export default function Login() {
  const { signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await signIn(values); navigate('/'); } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setBusy(false); }
  }
  return <section className="auth-section"><div className="auth-card"><span className="auth-icon"><HeartHandshake size={25} /></span><span className="eyebrow">Welcome back</span><h1>Good to see you.</h1><p>Sign in to continue sharing good things.</p>{location.state?.notice && <StatusMessage variant="success">{location.state.notice}</StatusMessage>}<form className="auth-form" onSubmit={submit}><label className="field">Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label><label className="field">Password<input name="password" type="password" required autoComplete="current-password" placeholder="Your password" /></label>{error && <StatusMessage variant="error">{error}</StatusMessage>}<button className="button button-primary button-wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button></form><p className="auth-switch">New to ShareMeal? <Link to="/register">Create an account</Link></p></div></section>;
}
