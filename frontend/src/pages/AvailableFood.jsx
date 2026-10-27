import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, MapPin, PackageCheck, Search } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/formatDate.js';

const initialFilters = { search: '', city: '', category: '', foodType: '', before: '', sort: 'newest', radiusKm: '25', latitude: '', longitude: '' };

export default function AvailableFood() {
  const [donations, setDonations] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [requestingId, setRequestingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const latestRequest = useRef(0);
  const location = useLocation();
  const { user } = useAuth();

  const loadDonations = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    const params = { page, limit: 9, sort: filters.sort };
    for (const key of ['search', 'city', 'category', 'foodType']) {
      if (filters[key]) params[key] = filters[key];
    }
    if (filters.before) params.before = new Date(filters.before).toISOString();
    if (Boolean(filters.latitude) !== Boolean(filters.longitude)) {
      setError('Enter both latitude and longitude, or leave both blank.');
      setLoading(false);
      return;
    }
    if (filters.sort === 'distance' && (!filters.latitude || !filters.longitude)) {
      setError('Enter coordinates or use your browser location to sort by distance.');
      setLoading(false);
      return;
    }
    if (filters.latitude && filters.longitude) {
      params.lat = Number(filters.latitude);
      params.lng = Number(filters.longitude);
      params.radiusKm = Number(filters.radiusKm);
    }
    try {
      const { data } = await api.get('/donations', { params });
      if (requestId === latestRequest.current) {
        setDonations(data.donations);
        setPagination(data.pagination);
      }
    } catch (requestError) {
      if (requestId === latestRequest.current) setError(getErrorMessage(requestError));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadDonations(); }, 250);
    return () => clearTimeout(timer);
  }, [loadDonations]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function useLocationForSearch() {
    setError('');
    if (!navigator.geolocation) {
      setError('Location access is not available in this browser. You can enter coordinates manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setPage(1); setFilters((current) => ({ ...current, latitude: String(coords.latitude), longitude: String(coords.longitude), sort: 'distance' })); },
      () => setError('Location permission was not granted. Enter a city or coordinates instead.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function requestDonation(id) {
    setRequestingId(id);
    setError('');
    setNotice('');
    try {
      await api.post(`/donations/${id}/requests`);
      setDonations((current) => current.filter((donation) => donation._id !== id));
      setNotice('Request sent. The donor will need to confirm the collection.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setRequestingId('');
    }
  }

  return (
    <>
      <PageIntro eyebrow="Nearby generosity" title="Food ready to be shared." description="Search current listings. Pickup addresses stay private until you are part of an authorized handoff." />
      <section className="section listings-section"><div className="container">
        {location.state?.notice && <StatusMessage variant="success">{location.state.notice}</StatusMessage>}
        {user?.role === 'ngo' && user.ngoProfile?.verificationStatus !== 'approved' && <StatusMessage>NGO accounts are reviewed before they can request food. Your account is not approved yet.</StatusMessage>}
        {notice && <StatusMessage variant="success">{notice}</StatusMessage>}
        {error && <StatusMessage variant="error">{error}</StatusMessage>}
        <form className="search-panel" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
          <div className="filter-field filter-search"><label htmlFor="food-search">Search food</label><input id="food-search" name="search" value={filters.search} onChange={updateFilter} placeholder="Food name, details or city" /></div>
          <div className="filter-field"><label htmlFor="food-category">Category</label><select id="food-category" name="category" value={filters.category} onChange={updateFilter}><option value="">All categories</option><option value="prepared">Prepared food</option><option value="produce">Fresh produce</option><option value="packaged">Packaged</option><option value="bakery">Bakery</option><option value="other">Other</option></select></div>
          <div className="filter-field"><label htmlFor="food-type">Food type</label><select id="food-type" name="foodType" value={filters.foodType} onChange={updateFilter}><option value="">All types</option><option value="vegetarian">Vegetarian</option><option value="non_vegetarian">Non-vegetarian</option><option value="vegan">Vegan</option></select></div>
          <div className="filter-field"><label htmlFor="food-city">City</label><input id="food-city" name="city" value={filters.city} onChange={updateFilter} placeholder="City name" /></div>
          <div className="filter-field"><label htmlFor="food-deadline">Deadline before</label><input id="food-deadline" name="before" type="datetime-local" value={filters.before} onChange={updateFilter} /></div>
          <div className="filter-field"><label htmlFor="food-sort">Sort by</label><select id="food-sort" name="sort" value={filters.sort} onChange={updateFilter}><option value="newest">Newest</option><option value="deadline">Soonest deadline</option><option value="distance">Nearest</option></select></div>
          <div className="filter-field"><label htmlFor="food-radius">Radius (km)</label><select id="food-radius" name="radiusKm" value={filters.radiusKm} onChange={updateFilter}><option value="5">5 km</option><option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option></select></div>
          <div className="filter-field"><label htmlFor="food-latitude">Latitude (optional)</label><input id="food-latitude" name="latitude" type="number" min="-90" max="90" step="any" value={filters.latitude} onChange={updateFilter} placeholder="Manual coordinates" /></div>
          <div className="filter-field"><label htmlFor="food-longitude">Longitude (optional)</label><input id="food-longitude" name="longitude" type="number" min="-180" max="180" step="any" value={filters.longitude} onChange={updateFilter} placeholder="Manual coordinates" /></div>
          <div className="filter-location"><span>Precise location is optional. We only request browser location after you choose below. City search works without geocoding.</span><button type="button" className="button button-outline" onClick={useLocationForSearch}><MapPin size={15} /> Use my location</button><button type="submit" className="button button-primary"><Search size={15} /> Search</button></div>
        </form>
        {loading && <StatusMessage>Finding available food listings…</StatusMessage>}
        {!loading && !error && donations.length === 0 && <div className="empty-state"><span className="empty-icon"><PackageCheck size={27} /></span><h2>It starts with a little extra.</h2><p>No available donations match these filters. Try broadening your search, or share your first listing.</p><Link to="/donate" className="button button-primary">List food to share <ArrowRight size={16} /></Link></div>}
        {!loading && donations.length > 0 && <>
          <p className="result-count">{pagination.total} available {pagination.total === 1 ? 'listing' : 'listings'}</p>
          <div className="listing-grid">{donations.map((item) => <article className="listing-card" key={item._id}>
            <div className="listing-card-top"><span className="listing-category">{item.category}</span><span className="listing-status">Available</span></div>
            <h2>{item.title}</h2><p>{item.description}</p>
            <div className="listing-meta"><span><PackageCheck size={15} /> {item.quantity} {item.unit}</span><span><MapPin size={15} /> {item.city}</span>{item.distanceKm !== undefined && <span>{item.distanceKm.toFixed(1)} km away</span>}</div>
            <div className="listing-footer"><span>Collect by {formatDate(item.expiresAt)}</span><span>Donor: {item.donor?.name || 'Community donor'}</span></div>
            <Link className="text-link listing-details-link" to={`/food/${item._id}`}>View details <ArrowRight size={15} /></Link>
            {user?.role === 'ngo' && user.ngoProfile?.verificationStatus === 'approved' && <button className="button button-primary listing-request" disabled={requestingId === item._id} onClick={() => requestDonation(item._id)}>{requestingId === item._id ? 'Requesting…' : 'Request donation'} <ArrowRight size={15} /></button>}
          </article>)}</div>
          {pagination.pages > 1 && <div className="pagination"><button className="button button-outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pagination.pages}</span><button className="button button-outline" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div>}
        </>}
      </div></section>
    </>
  );
}
