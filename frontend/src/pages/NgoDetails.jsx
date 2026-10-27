import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, MapPin, UsersRound } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import api, { getErrorMessage } from '../services/api.js';

export default function NgoDetails() {
  const { id } = useParams();
  const [ngo, setNgo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.get(`/ngos/${id}`).then(({ data }) => { if (active) setNgo(data.ngo); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  return <>
    <PageIntro eyebrow="Community organization" title={ngo?.ngoProfile.organizationName || 'Organization profile'} description="Public information shared by this organization." />
    <section className="section"><div className="container profile-public">
      <Link className="text-link back-link" to="/ngos"><ArrowLeft size={15} /> Back to organizations</Link>
      {loading && <StatusMessage>Loading organization profile…</StatusMessage>}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {ngo && <article className="ngo-profile-card"><span className="ngo-card-icon"><UsersRound size={25} /></span><span className="ngo-verified"><BadgeCheck size={15} /> Approved by an administrator</span><h2>{ngo.ngoProfile.organizationName}</h2><p>{ngo.ngoProfile.description || 'This organization has not added a public description.'}</p><span className="ngo-location"><MapPin size={15} /> {ngo.ngoProfile.city || 'Location not listed'}</span><div className="profile-facts"><div><strong>Food categories accepted</strong><span>{ngo.ngoProfile.categoriesAccepted?.join(', ') || 'Not specified'}</span></div><div><strong>Service radius</strong><span>{ngo.ngoProfile.serviceRadiusKm} km (organization reported)</span></div><div><strong>Operating hours</strong><span>{ngo.ngoProfile.operatingHours || 'Contact organization for availability'}</span></div></div><small>Approval indicates administrator review, not a guarantee of service availability or food handling practices.</small></article>}
    </div></section>
  </>;
}
