import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api.js';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { limit: 8 } });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      await refresh();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all');
      await refresh();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <div className="notification-wrap">
      <button className="notification-toggle" type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Bell size={18} />{unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && <div className="notification-popover" role="dialog" aria-label="Notifications">
        <div className="notification-heading"><strong>Notifications</strong><button type="button" aria-label="Close notifications" onClick={() => setOpen(false)}><X size={16} /></button></div>
        {error && <p className="notification-error" role="alert">{error}</p>}
        {!error && notifications.length === 0 && <p className="notification-empty">You are all caught up.</p>}
        <div className="notification-list">{notifications.map((item) => <article className={item.readAt ? 'notification-item' : 'notification-item notification-unread'} key={item._id}><p>{item.message}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>{!item.readAt && <button type="button" onClick={() => markRead(item._id)}><Check size={13} /> Mark read</button>}</article>)}</div>
        {unreadCount > 0 && <button className="notification-read-all" type="button" onClick={markAllRead}>Mark all read</button>}
      </div>}
    </div>
  );
}
