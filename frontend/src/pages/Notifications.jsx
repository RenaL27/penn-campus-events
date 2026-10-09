import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/discovery/Layout';
import { EmptyState, ErrorMessage, Loading, Pagination } from '../components/discovery/Feedback';
import { api } from '../utils/api';
export default function Notifications() {
  const [data, setData] = useState({ items: [], unread: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const load = useCallback(async () => {
    setError('');
    try { setData(await api(`/notifications?page=${page}`)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { setLoading(true); load(); }, [load]);
  async function markAll() {
    setBusy(true);
    try { await api('/notifications/read-all', 'PUT'); await load(); window.dispatchEvent(new Event('notifications-read')); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function open(item) {
    setBusy(true);
    try { if (!item.readAt) await api(`/notifications/${item._id}/read`, 'PUT'); window.dispatchEvent(new Event('notifications-read')); navigate(item.href); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <Layout><div className="page-intro"><p className="eyebrow">ACCOUNT ACTIVITY</p><h1>Notifications</h1><p>Event registration, organizer updates, and friend requests.</p></div><div className="notification-toolbar"><span>{data.unread} unread</span><button className="button button-outline" disabled={busy || !data.unread} onClick={markAll}>Mark all as read</button></div><ErrorMessage error={error} />{loading ? <Loading /> : !error && (data.items.length ? <div className="notification-list">{data.items.map(item => <button key={item._id} className={`notification-row ${item.readAt ? '' : 'unread'}`} onClick={() => open(item)} disabled={busy}><span className="notification-dot" /><span><strong>{item.title}</strong><span className="notification-message">{item.message}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></span><span aria-hidden="true">→</span></button>)}</div> : <EmptyState title="No notifications yet">Registration activity, updates to your events, and friend requests will appear here.</EmptyState>)}<Pagination page={page} pages={data.pages} onChange={setPage} /></Layout>;
}
