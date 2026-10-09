import { Link, NavLink, useNavigate } from "react-router-dom";
import { isLoggedIn } from "../../utils/api";
import Icon from "./Icon";
export default function Layout({ children }) {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };
  return (
    <div className="discovery-app">
      <header className="site-header">
        <Link className="wordmark" to="/">
          <span className="brand-mark">
            p<span>e</span>
          </span>
          Penn<span>Events</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            For you
          </NavLink>
          <NavLink to="/events">Explore</NavLink>
          <NavLink to="/friends">Friends</NavLink>
          {loggedIn && <NavLink to="/dashboard">My events</NavLink>}
        </nav>
        <div className="header-actions">
          {loggedIn ? (
            <>
              <Link className="button button-small" to="/create">
                <Icon name="plus" size={16} />
                Host an event
              </Link>
              <button className="text-button logout" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="button button-small" to="/login">
              Log in
            </Link>
          )}
        </div>
      </header>
      <main className="discovery-main">{children}</main>
      <footer className="site-footer">
        <span>PennEvents</span>
        <span>Campus events and student activities</span>
        <Link to="/preferences">Your interests</Link>
      </footer>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/" end>
          <Icon name="home" />
          For you
        </NavLink>
        <NavLink to="/events">
          <Icon name="search" />
          Explore
        </NavLink>
        <NavLink to="/friends">
          <Icon name="people" />
          Friends
        </NavLink>
        <NavLink to="/dashboard">
          <Icon name="calendar" />
          My events
        </NavLink>
      </nav>
    </div>
  );
}
