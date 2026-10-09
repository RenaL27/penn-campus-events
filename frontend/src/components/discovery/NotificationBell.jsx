import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    const refresh = () => { if (!document.hidden) api('/notifications/unread').then(data => { if (active) setUnread(data.unread); }).catch(() => {}); };
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener('notifications-read', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('notifications-read', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return <Link className="notification-bell" to="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>{unread > 0 && <span>{unread > 99 ? '99+' : unread}</span>}</Link>;
}
