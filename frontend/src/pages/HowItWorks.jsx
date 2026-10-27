import { ArrowRight, BadgeCheck, Check, ClipboardList, HandHeart, MapPin, PackageCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageIntro from '../components/PageIntro.jsx';
import FeatureCard from '../components/FeatureCard.jsx';

export default function HowItWorks() {
  return (
    <>
      <PageIntro eyebrow="Simple by design" title="From a little extra to a lot of good." description="A clear, careful handoff helps donors and community organizations share food with confidence." />
      <section className="section"><div className="container"><div className="feature-grid three"><FeatureCard icon={ClipboardList} number="01" title="A donor lists food">Add a clear description, quantity, category, location and a realistic pickup deadline.</FeatureCard><FeatureCard icon={MapPin} number="02" title="An NGO requests it">Nearby organizations browse available food. Only administrator-verified NGOs can request a listing.</FeatureCard><FeatureCard icon={PackageCheck} number="03" title="Collection is confirmed">The donor confirms the request. The NGO records pickup and, later, distribution.</FeatureCard></div></div></section>
      <section className="section section-muted"><div className="container safety-grid"><div><span className="eyebrow">The important part</span><h2>Safe sharing is<br />thoughtful sharing.</h2><p>ShareMeal helps coordinate a connection; it does not inspect, transport or certify donated food. Donors remain responsible for accurate information and safe handling.</p><Link to="/about" className="text-link">Read about our approach <ArrowRight size={15} /></Link></div><ul className="check-list"><li><Check /> List only food that is safe and suitable to donate.</li><li><Check /> Include allergens, packaging and expiry details where relevant.</li><li><Check /> Agree on a pickup window that allows safe collection.</li><li><Check /> Never treat an unverified profile as an approved NGO.</li><li><Check /> Keep communication and handoff arrangements clear.</li></ul></div></section>
      <section className="trust-strip"><div className="container trust-inner"><ShieldCheck size={26} /><div><h3>Trust is earned, not assumed.</h3><p>Organizations join as unverified and can request food only after an administrator approves their NGO account.</p></div><Link to="/register" className="button button-primary">Get started <ArrowRight size={16} /></Link></div></section>
    </>
  );
}
