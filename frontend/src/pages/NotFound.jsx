import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return <section className="not-found"><span className="not-found-number">404</span><span className="eyebrow">A little off the menu</span><h1>We can’t find that page.</h1><p>The link may have changed, or this page may have wandered off.</p><Link className="button button-primary" to="/"><ArrowLeft size={16} /> Back home</Link></section>;
}
