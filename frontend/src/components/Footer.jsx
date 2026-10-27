import { Link } from 'react-router-dom';
import { ArrowUpRight, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="brand brand-light" to="/"><span className="brand-mark"><HeartHandshake size={21} /></span><span>share<span className="brand-accent">meal</span></span></Link>
          <p>Good food deserves a good home.<br />Let&apos;s make sharing the easiest part.</p>
          <Link className="footer-contact-link" to="/contact">Say hello <ArrowUpRight size={15} /></Link>
        </div>
        <div className="footer-links">
          <div><h3>Explore</h3><Link to="/about">About us</Link><Link to="/how-it-works">How it works</Link><Link to="/food">Available food</Link></div>
          <div><h3>Get involved</h3><Link to="/donate">Donate food</Link><Link to="/ngos">For NGOs</Link><Link to="/register">Create an account</Link></div>
          <div><h3>Good to know</h3><Link to="/contact">Contact</Link><Link to="/food-safety">Food safety</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
        </div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} ShareMeal. Made for a more generous neighborhood.</span><span>Demo platform · Sample impact data is illustrative</span></div>
    </footer>
  );
}
