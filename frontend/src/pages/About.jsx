import { HeartHandshake, Leaf, ShieldCheck, UsersRound } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import FeatureCard from '../components/FeatureCard.jsx';

export default function About() {
  return (
    <>
      <PageIntro eyebrow="A little more good, close to home" title="Good food should bring people closer." description="ShareMeal is a community-first platform designed to help surplus food travel from local donors to nonprofit organizations that can share it with care." />
      <section className="section"><div className="container story-grid"><div><span className="eyebrow">Why ShareMeal</span><h2>Less waste.<br /><span className="text-green">More connection.</span></h2></div><div className="story-copy"><p>Every neighborhood has food businesses and people with a little extra, alongside organizations working to support their communities. ShareMeal gives them a simple place to find one another.</p><p>Our first promise is to make the handoff clearer: honest listing details, nearby discovery and an approval process that keeps NGO participation accountable.</p><p>We are building the platform thoughtfully. No inflated impact claims, no shortcuts around trust — just a better way for good food to be shared locally.</p></div></div></section>
      <section className="section section-muted"><div className="container"><div className="feature-grid four"><FeatureCard icon={HeartHandshake} title="Community first">Built to help neighbors and local organizations work together.</FeatureCard><FeatureCard icon={ShieldCheck} title="Trust by design">NGO accounts require administrator approval to collect.</FeatureCard><FeatureCard icon={Leaf} title="Thoughtful sharing">Food quality and safe handling always come first.</FeatureCard><FeatureCard icon={UsersRound} title="Open to everyone">Businesses and individuals can both be part of the good.</FeatureCard></div></div></section>
    </>
  );
}
