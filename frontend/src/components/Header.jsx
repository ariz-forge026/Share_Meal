import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Brand from './Brand.jsx';
import { useAuth } from '../hooks/useAuth.js';
import StatusMessage from './StatusMessage.jsx';
import NotificationCenter from './NotificationCenter.jsx';

const links = [
  ['How it works', '/how-it-works'],
  ['Available food', '/food'],
  ['Find NGOs', '/ngos'],
  ['About', '/about'],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, signOut, authError } = useAuth();
  return (
    <header className="site-header">
      <div className="container nav-container">
        <Brand />
        <button className="menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={open ? 'main-nav nav-open' : 'main-nav'} aria-label="Main navigation">
          {links.map(([label, path]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <div className="nav-actions">
            {user ? (
              <>
                <NotificationCenter />
                {user.role === 'admin' ? <>
                  <Link className="nav-login" to="/admin/ngos" onClick={() => setOpen(false)}>NGO review</Link>
                  <Link className="nav-login" to="/admin/users" onClick={() => setOpen(false)}>Users</Link>
                  <Link className="nav-login" to="/admin/reports" onClick={() => setOpen(false)}>Reports</Link>
                </> : <Link className="nav-login" to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>}
                {user.role === 'ngo' && user.ngoProfile?.verificationStatus !== 'approved' && <Link className="nav-login" to="/ngos/apply" onClick={() => setOpen(false)}>NGO review</Link>}
                {user.role === 'volunteer' && <Link className="nav-login" to="/tasks" onClick={() => setOpen(false)}>My tasks</Link>}
                <Link className="nav-login" to="/profile" onClick={() => setOpen(false)}>Profile</Link>
                <button className="button button-outline button-small" onClick={signOut}>Sign out</button>
              </>
            ) : (
              <>
                <Link className="nav-login" to="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link className="button button-primary button-small" to="/register" onClick={() => setOpen(false)}>Join ShareMeal</Link>
              </>
            )}
          </div>
        </nav>
      </div>
      {authError && <div className="container"><StatusMessage variant={authError.startsWith('MongoDB is not configured') ? 'info' : 'error'}>{authError}</StatusMessage></div>}
    </header>
  );
}
