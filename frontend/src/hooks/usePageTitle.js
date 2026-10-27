import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Home',
  '/about': 'About',
  '/how-it-works': 'How it works',
  '/donate': 'Donate food',
  '/ngos': 'Find NGOs',
  '/food': 'Available food',
  '/login': 'Log in',
  '/register': 'Create an account',
  '/contact': 'Contact',
  '/food-safety': 'Food safety',
  '/privacy': 'Privacy',
  '/terms': 'Terms',
  '/my-donations': 'My activity',
  '/admin/ngos': 'NGO review',
  '/admin/users': 'User management',
  '/admin/reports': 'Reports and activity',
  '/dashboard': 'Dashboard',
  '/profile': 'Profile settings',
  '/ngos/apply': 'NGO verification',
  '/tasks': 'Collection tasks',
};

export function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = pageTitles[pathname]
      || (pathname.startsWith('/food/') ? 'Donation details' : null)
      || (pathname.startsWith('/ngos/') ? 'NGO profile' : null)
      || 'Page not found';
    document.title = `${title} | ShareMeal`;
  }, [pathname]);
}
