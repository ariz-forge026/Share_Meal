import AppRoutes from './routes/AppRoutes.jsx';
import { usePageTitle } from './hooks/usePageTitle.js';

export default function App() {
  usePageTitle();
  return <AppRoutes />;
}
