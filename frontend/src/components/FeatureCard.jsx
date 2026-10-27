export default function FeatureCard({ icon: Icon, number, title, children, tone = 'green' }) {
  return (
    <article className={`feature-card tone-${tone}`}>
      <div className="feature-icon">{Icon && <Icon size={23} strokeWidth={1.8} />}</div>
      {number && <span className="step-number">{number}</span>}
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
