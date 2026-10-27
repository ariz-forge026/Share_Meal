import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';

export default function Brand() {
  return (
    <Link className="brand" to="/" aria-label="ShareMeal home">
      <span className="brand-mark"><HeartHandshake size={22} strokeWidth={2.2} /></span>
      <span>share<span className="brand-accent">meal</span></span>
    </Link>
  );
}
