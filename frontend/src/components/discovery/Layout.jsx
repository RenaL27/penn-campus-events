import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { isLoggedIn } from "../../utils/api";
import NotificationBell from "./NotificationBell";
import Icon from "./Icon";
export default function Layout({ children, title }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const headings = {
    "/": "Discover Events",
    "/events": "Search For Events",
    "/dashboard": "Calendar",
    "/profile": "Profile",
    "/friends": "Friends",
    "/preferences": "Your Interests",
    "/notifications": "Notifications",
    "/create": "Create Event",
    "/login": "Log In",
    "/register": "Create Account",
  };
  return (
    <div className="discovery-app">
      <header className="app-header">
        {pathname === "/" ? (
          <Link
            to="/preferences"
            className="icon-button"
            aria-label="Edit interests"
          >
            <Icon name="filter" />
          </Link>
        ) : (
          <Link
            to={pathname.startsWith("/events/") ? "/events" : "/"}
            className="icon-button"
            aria-label="Back to discovery"
          >
            <Icon name="back" />
          </Link>
        )}
        <h1>{title || headings[pathname] || "Event Details"}</h1>
        {isLoggedIn() ? (
          <NotificationBell />
        ) : (
          <Link className="icon-button" to="/login" aria-label="Log in">
            <Icon name="user" />
          </Link>
        )}
      </header>
      <main className="discovery-main">{children}</main>
      <nav className="mobile-nav" aria-label="Main navigation">
        {[
          ["/", "home", "Home"],
          ["/events", "search", "Search"],
          ["/dashboard", "calendar", "Calendar"],
          ["/profile", "user", "Profile"],
        ].map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === "/"} aria-label={label}>
            <Icon name={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
