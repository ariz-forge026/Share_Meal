import { Route, Routes } from 'react-router-dom';
import SiteLayout from '../layouts/SiteLayout.jsx';
import Home from '../pages/Home.jsx';
import About from '../pages/About.jsx';
import HowItWorks from '../pages/HowItWorks.jsx';
import DonateFood from '../pages/DonateFood.jsx';
import FindNgos from '../pages/FindNgos.jsx';
import AvailableFood from '../pages/AvailableFood.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Contact from '../pages/Contact.jsx';
import NotFound from '../pages/NotFound.jsx';
import MyDonations from '../pages/MyDonations.jsx';
import AdminNgos from '../pages/AdminNgos.jsx';
import DonationDetails from '../pages/DonationDetails.jsx';
import NgoDetails from '../pages/NgoDetails.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import ProfileSettings from '../pages/ProfileSettings.jsx';
import VerificationApplication from '../pages/VerificationApplication.jsx';
import CollectionTasks from '../pages/CollectionTasks.jsx';
import FoodSafety from '../pages/FoodSafety.jsx';
import PrivacyPolicy from '../pages/PrivacyPolicy.jsx';
import Terms from '../pages/Terms.jsx';
import AdminUsers from '../pages/AdminUsers.jsx';
import AdminReports from '../pages/AdminReports.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="donate" element={<DonateFood />} />
        <Route path="ngos" element={<FindNgos />} />
        <Route path="food" element={<AvailableFood />} />
        <Route path="food/:id" element={<DonationDetails />} />
        <Route path="ngos/:id" element={<NgoDetails />} />
        <Route path="my-donations" element={<MyDonations />} />
        <Route path="admin/ngos" element={<AdminNgos />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/reports" element={<AdminReports />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="ngos/apply" element={<VerificationApplication />} />
        <Route path="tasks" element={<CollectionTasks />} />
        <Route path="food-safety" element={<FoodSafety />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
