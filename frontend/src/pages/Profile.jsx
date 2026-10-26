import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/discovery/Layout";
import Icon from "../components/discovery/Icon";
import { Avatar } from "../components/discovery/EventCard";
import { ErrorMessage, Loading } from "../components/discovery/Feedback";
import { api, isLoggedIn } from "../utils/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  useEffect(() => {
    if (!loggedIn) return;
    const controller = new AbortController();
    api("/users/me", "GET", null, true, controller.signal)
      .then(setUser)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [loggedIn]);
  return (
    <Layout>
      <ErrorMessage error={error} />
      {loggedIn && !user && !error ? (
        <Loading />
      ) : (
        <>
          <section className="profile-card">
            <Avatar user={user || { name: "Penn Student" }} />
            <div>
              <h2>{user?.name || "Welcome to PennEvents"}</h2>
              <p>
                {user
                  ? `@${user.username}`
                  : "Discover events. Keep your plans in one place."}
              </p>
              {user?.email && <p>{user.email}</p>}
            </div>
          </section>
          {!loggedIn && (
            <Link className="button profile-login" to="/login">
              Log in or create an account
            </Link>
          )}
          {[
            [
              "Events",
              [
                ["calendar", "My calendar", "/dashboard"],
                ["plus", "Host an event", "/create"],
              ],
            ],
            [
              "Preferences",
              [
                ["filter", "Your interests", "/preferences"],
                ["clock", "Notifications", "/notifications"],
              ],
            ],
            ["Social", [["people", "Friends", "/friends"]]],
          ].map(([heading, links]) => (
            <section className="profile-section" key={heading}>
              <h2>{heading}</h2>
              {links.map(([icon, label, to]) => (
                <Link to={to} key={to}>
                  <Icon name={icon} />
                  <span>{label}</span>
                  <Icon name="arrow" size={16} />
                </Link>
              ))}
            </section>
          ))}
          <section className="install-note">
            <h2>Keep PennEvents on your phone</h2>
            <p>
              In Safari, tap Share → Add to Home Screen. In Chrome on Android,
              choose Install app or Add to Home screen from the menu.
            </p>
          </section>
          {loggedIn && (
            <button
              className="text-button sign-out"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                navigate("/login");
              }}
            >
              Sign out
            </button>
          )}
        </>
      )}
    </Layout>
  );
}
