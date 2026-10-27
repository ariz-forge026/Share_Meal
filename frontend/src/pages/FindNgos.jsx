import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, MapPin, Search, UsersRound } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import api, { getErrorMessage } from '../services/api.js';

export default function FindNgos() {
  const [ngos, setNgos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [coords, setCoords] = useState({ latitude: '', longitude: '' });
  const [radiusKm, setRadiusKm] = useState('25');
  const [search, setSearch] = useState(null);

  const loadNgos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/ngos/nearby', { params: search || {} });
      setNgos(data.ngos);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { void loadNgos(); }, [loadNgos]);

  function useBrowserLocation() {
    setError('');
    if (!navigator.geolocation) {
      setError('Location access is not available in this browser. You can enter coordinates manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: point }) => {
        setCoords({ latitude: String(point.latitude), longitude: String(point.longitude) });
        setSearch({ lat: point.latitude, lng: point.longitude, radiusKm: Number(radiusKm), ...(category && { category }) });
      },
      () => setError('Location permission was not granted. Search by city or enter coordinates instead.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function submitSearch(event) {
    event.preventDefault();
    const params = {};
    if (city.trim()) params.city = city.trim();
    if (category) params.category = category;
    if (coords.latitude && coords.longitude) {
      params.lat = Number(coords.latitude);
      params.lng = Number(coords.longitude);
      params.radiusKm = Number(radiusKm);
    }
    setSearch(params);
  }

  return (
    <>
      <PageIntro eyebrow="Good work, close by" title="Meet the organizations doing good." description="Browse administrator-approved nonprofit organizations and find potential community partners." />
      <section className="section listings-section"><div className="container">
        <form className="search-panel ngo-search-panel" onSubmit={submitSearch}>
          <div className="filter-field"><label htmlFor="ngo-city">City</label><input id="ngo-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Enter city name" /></div>
          <div className="filter-field"><label htmlFor="ngo-category">Food accepted</label><select id="ngo-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option><option value="prepared">Prepared food</option><option value="produce">Fresh produce</option><option value="packaged">Packaged</option><option value="bakery">Bakery</option><option value="other">Other</option></select></div>
          <div className="filter-field"><label htmlFor="ngo-radius">Radius (km)</label><select id="ngo-radius" value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)}><option value="5">5 km</option><option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option></select></div>
          <div className="filter-field"><label htmlFor="ngo-latitude">Latitude (optional)</label><input id="ngo-latitude" type="number" min="-90" max="90" step="any" value={coords.latitude} onChange={(event) => setCoords({ ...coords, latitude: event.target.value })} placeholder="Manual coordinates" /></div>
          <div className="filter-field"><label htmlFor="ngo-longitude">Longitude (optional)</label><input id="ngo-longitude" type="number" min="-180" max="180" step="any" value={coords.longitude} onChange={(event) => setCoords({ ...coords, longitude: event.target.value })} placeholder="Manual coordinates" /></div>
          <div className="filter-location"><span>Precise location is optional. Browser location is requested only when you choose. City search works without geocoding.</span><button type="button" className="button button-outline" onClick={useBrowserLocation}><MapPin size={15} /> Use my location</button><button type="submit" className="button button-primary"><Search size={15} /> Search NGOs</button></div>
        </form>
        {loading && <StatusMessage>Searching verified community organizations…</StatusMessage>}
        {!loading && error && <StatusMessage variant="error">{error}</StatusMessage>}
        {!loading && !error && ngos.length === 0 && <div className="empty-state"><span className="empty-icon"><UsersRound size={27} /></span><h2>No approved organizations found.</h2><p>Try a different city or category. New organizations appear only after an administrator approves their application.</p><Link className="button button-primary" to="/register">Register an organization <ArrowRight size={16} /></Link></div>}
        {!loading && ngos.length > 0 && <div className="listing-grid">{ngos.map((ngo) => <article className="ngo-card" key={ngo._id}>
          <span className="ngo-card-icon"><UsersRound size={23} /></span><div className="ngo-verified"><BadgeCheck size={15} /> Administrator approved</div>
          <h2>{ngo.ngoProfile.organizationName}</h2><p>{ngo.ngoProfile.description || 'A local nonprofit organization sharing care in the community.'}</p>
          <span className="ngo-location"><MapPin size={15} /> {ngo.ngoProfile.city || 'Local organization'}{Number.isFinite(ngo.distanceMeters) && ` · ${(ngo.distanceMeters / 1000).toFixed(1)} km`}</span>
          {ngo.ngoProfile.categoriesAccepted?.length > 0 && <div className="ngo-categories">{ngo.ngoProfile.categoriesAccepted.map((item) => <span key={item}>{item}</span>)}</div>}
          <Link className="text-link ngo-profile-link" to={`/ngos/${ngo._id}`}>View organization <ArrowRight size={15} /></Link>
        </article>)}</div>}
      </div></section>
    </>
  );
}
