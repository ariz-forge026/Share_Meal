import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, BadgeCheck, Heart, Leaf, MapPin, PackageCheck, ShieldCheck, Sparkles, Utensils } from 'lucide-react';
import FeatureCard from '../components/FeatureCard.jsx';
import SectionHeading from '../components/SectionHeading.jsx';

const categories = [
  { icon: Utensils, title: 'Freshly prepared', text: 'Good food from kitchens, cafes and caterers.' },
  { icon: Leaf, title: 'Fresh produce', text: 'Fruit and vegetables ready to be enjoyed.' },
  { icon: PackageCheck, title: 'Packaged pantry', text: 'Sealed groceries with time left on the clock.' },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-dot" /> GOOD FOOD. GOOD NEIGHBORS.</div>
            <h1>A little extra<br />can mean <span>a lot.</span></h1>
            <p className="hero-description">Share your surplus food with local organizations doing good work in your neighborhood. Easy to give. Meaningful to receive.</p>
            <div className="hero-actions">
              <Link to="/donate" className="button button-primary">Donate food <ArrowRight size={17} /></Link>
              <Link to="/ngos" className="button button-text">Find local NGOs <ArrowRight size={17} /></Link>
            </div>
            <div className="hero-note"><ShieldCheck size={17} /> NGOs are verified before they can collect</div>
          </div>
          <div className="hero-art" aria-label="Illustration of a shared meal">
            <div className="art-sun" />
            <div className="art-card art-card-top"><span className="art-card-icon"><Heart size={16} fill="currentColor" /></span><span><b>Good food, shared</b><small>Right around the corner</small></span><span className="art-sparkle"><Sparkles size={16} /></span></div>
            <div className="food-scene">
              <div className="food-plate"><div className="plate-food food-leaf-one" /><div className="plate-food food-leaf-two" /><div className="plate-food food-tomato" /><div className="plate-food food-bread" /><div className="plate-food food-peas" /></div>
              <div className="scene-squiggle">✳</div><div className="scene-flower">✿</div>
            </div>
            <div className="art-card art-card-bottom"><span className="location-icon"><MapPin size={17} /></span><span><b>Close to home</b><small>Local donors & local care</small></span></div>
            <div className="hero-art-caption">Better together, one meal at a time <ArrowDownRight size={15} /></div>
          </div>
        </div>
        <div className="hero-bottom container"><span>MADE FOR NEIGHBORHOODS THAT CARE</span><span className="hero-bottom-rule" /><span>SHARE A LITTLE. CHANGE A LOT.</span></div>
      </section>

      <section className="section section-how">
        <div className="container">
          <SectionHeading eyebrow="A simple way to do good" title="Good things happen in three steps." description="No complicated logistics. Just good food finding the people who can put it to good use." />
          <div className="feature-grid three">
            <FeatureCard icon={Utensils} number="01" title="List what you have">Share the food, quantity and a convenient pickup window.</FeatureCard>
            <FeatureCard icon={MapPin} number="02" title="Meet a local NGO">Verified organizations nearby can request suitable donations.</FeatureCard>
            <FeatureCard icon={Heart} number="03" title="Make sharing count">Confirm collection, then let your food do a little more good.</FeatureCard>
          </div>
          <div className="center-link"><Link className="button button-outline" to="/how-it-works">See how it works <ArrowRight size={16} /></Link></div>
        </div>
      </section>

      <section className="section section-categories">
        <div className="container">
          <div className="split-heading"><SectionHeading align="left" eyebrow="Every bit helps" title="What can you share?" description="If it is safe, wholesome and yours to give, there may be a neighbor who can use it." /><Link to="/donate" className="text-link">Start a donation <ArrowRight size={16} /></Link></div>
          <div className="category-grid">{categories.map(({ icon: Icon, title, text }, index) => <article className={`category-card category-${index + 1}`} key={title}><span className="category-icon">{createElement(Icon, { size: 23 })}</span><span className="category-count">0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="ngo-banner">
        <div className="container ngo-banner-inner"><div><span className="eyebrow eyebrow-light">FOR COMMUNITY ORGANIZATIONS</span><h2>Doing good work?<br /><em>Let food find you.</em></h2><p>Register your organization and connect with nearby donors. NGOs are reviewed before they can request food.</p><Link className="button button-cream" to="/register">Join as an NGO <ArrowRight size={16} /></Link></div><div className="ngo-illustration"><div className="ngo-ring"><Heart size={47} strokeWidth={1.2} /></div><div className="ngo-caption"><BadgeCheck size={17} /> Thoughtful sharing, trusted locally</div></div></div>
      </section>

      <section className="section section-impact">
        <div className="container impact-inner"><div><span className="eyebrow">A hopeful beginning</span><h2>Small actions.<br />A more generous table.</h2><p>These are illustrative demo numbers — real impact will appear here once the community starts sharing.</p></div><div className="impact-stats"><div><strong>24</strong><span>Illustrative food listings</span></div><div><strong>08</strong><span>Sample community partners</span></div><div><strong>120</strong><span>Demo portions shared</span></div><small>Illustrative demo data · not live platform totals</small></div></div>
      </section>

      <section className="trust-strip"><div className="container trust-inner"><ShieldCheck size={26} /><div><h3>Care comes before collection.</h3><p>Clear details, sensible pickup windows and verified NGO accounts help everyone share with confidence.</p></div><Link to="/about" className="text-link">Our approach <ArrowRight size={16} /></Link></div></section>
    </>
  );
}
