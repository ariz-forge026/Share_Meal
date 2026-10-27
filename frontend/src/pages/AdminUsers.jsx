import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import PageIntro from '../components/PageIntro.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import api, { getErrorMessage } from '../services/api.js';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get('/admin/users', { params: { page, limit: 20 } });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (requestError) { setError(getErrorMessage(requestError)); } finally { setLoading(false); }
  }, [page]);
  useEffect(() => { if (user?.role === 'admin') void loadUsers(); else setLoading(false); }, [user, loadUsers]);

  async function setStatus(record, accountStatus) {
    try {
      const { data } = await api.patch(`/admin/users/${record._id}/status`, { accountStatus });
      setUsers((current) => current.map((item) => item._id === record._id ? { ...item, accountStatus: data.user.accountStatus } : item));
      setNotice(`${record.email} account status changed to ${accountStatus}.`);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }
  return <>
    <PageIntro eyebrow="Administrator tools" title="Manage ShareMeal accounts." description="Review account status and suspend or restore access when necessary." />
    <section className="section"><div className="container">
      {user?.role !== 'admin' && <StatusMessage variant="error">Administrator access is required.</StatusMessage>}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}{notice && <StatusMessage variant="success">{notice}</StatusMessage>}
      {loading && <StatusMessage>Loading user records…</StatusMessage>}
      {!loading && users.length === 0 && !error && <div className="empty-state"><span className="empty-icon"><UserRound /></span><h2>No accounts found.</h2></div>}
      {!loading && users.length > 0 && <div className="table-scroll"><table><thead><tr><th>User</th><th>Role</th><th>Account</th><th>NGO review</th><th>Action</th></tr></thead><tbody>{users.map((record) => <tr key={record._id}><td><strong>{record.name}</strong><small>{record.email}</small></td><td>{record.role}</td><td><span className={`listing-status status-pill-${record.accountStatus}`}>{record.accountStatus}</span></td><td>{record.ngoProfile?.verificationStatus?.replaceAll('_', ' ') || '—'}</td><td>{record._id === user?.id || record.role === 'admin' ? <span className="muted-caption">Protected</span> : <button className="button button-outline button-small" onClick={() => setStatus(record, record.accountStatus === 'active' ? 'suspended' : 'active')}><ShieldCheck size={14} /> {record.accountStatus === 'active' ? 'Suspend' : 'Restore'}</button>}</td></tr>)}</tbody></table></div>}
      {pagination.pages > 1 && <div className="pagination"><button className="button button-outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pagination.pages}</span><button className="button button-outline" disabled={page === pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    </div></section>
  </>;
}
