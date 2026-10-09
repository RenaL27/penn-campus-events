import { useEffect, useState } from "react";
import { api, isLoggedIn } from "../utils/api";
import Layout from "../components/discovery/Layout";
import { Avatar } from "../components/discovery/EventCard";
import {
  ErrorMessage,
  EmptyState,
  Loading,
} from "../components/discovery/Feedback";
export default function Friends() {
  const [links, setLinks] = useState([]);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const me = localStorage.getItem("userId");
  const loggedIn = isLoggedIn();
  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    api("/users/me/friends")
      .then(setLinks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loggedIn]);
  const action = async (path, method) => {
    setBusy(true);
    setError("");
    try {
      await api(path, method);
      setLinks(await api("/users/me/friends"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const search = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setResults(await api(`/users/search?q=${encodeURIComponent(query)}`));
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Layout>
      <div className="page-intro">
        <p className="eyebrow">STUDENT CONNECTIONS</p>
        <h1>Friends</h1>
        <p>Connect with friends to discover the events they’re going to.</p>
      </div>
      {!loggedIn ? (
        <EmptyState
          title="Connect with classmates"
          link="/login"
          label="Log in to connect"
        >
          Your Friends Going feed includes a student after your friend request
          is accepted.
        </EmptyState>
      ) : (
        <>
          <ErrorMessage error={error} />
          <form className="search-box friends-search" onSubmit={search}>
            <input
              aria-label="Search students"
              minLength={2}
              required
              placeholder="Search by name or username"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="button" disabled={busy}>
              Find friends
            </button>
          </form>
          {searched && (
            <section className="people-panel">
              <h2>Search results</h2>
              {!results.length && (
                <p className="muted">No students found. Try another name.</p>
              )}
              {results.map((user) => {
                const existing = links.find(
                  (l) =>
                    l.requester?._id === user._id ||
                    l.recipient?._id === user._id,
                );
                return (
                  <div className="person-row" key={user._id}>
                    <Avatar user={user} />
                    <span>
                      <strong>{user.name}</strong>
                      <small>@{user.username}</small>
                    </span>
                    <button
                      className="button button-outline button-small"
                      disabled={busy || Boolean(existing)}
                      onClick={() =>
                        action(`/users/me/friends/${user._id}`, "POST")
                      }
                    >
                      {existing
                        ? existing.status === "accepted"
                          ? "Friends"
                          : "Request pending"
                        : "Add friend"}
                    </button>
                  </div>
                );
              })}
            </section>
          )}
          {loading ? (
            <Loading />
          ) : (
            <section className="people-panel">
              <h2>Your connections</h2>
              {!links.length && (
                <p className="muted">
                  Search for a friend above to send your first request.
                </p>
              )}
              {links.map((link) => {
                const incoming = link.recipient?._id === me;
                const user = incoming ? link.requester : link.recipient;
                if (!user) return null;
                return (
                  <div className="person-row" key={link._id}>
                    <Avatar user={user} />
                    <span>
                      <strong>{user.name}</strong>
                      <small>
                        {link.status === "accepted"
                          ? "Friend"
                          : incoming
                            ? "Wants to connect"
                            : "Request sent"}
                      </small>
                    </span>
                    <div className="person-actions">
                      {incoming && link.status === "pending" && (
                        <button
                          className="button button-small"
                          disabled={busy}
                          onClick={() =>
                            action(`/users/me/friends/${link._id}`, "PUT")
                          }
                        >
                          Accept
                        </button>
                      )}
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() =>
                          action(`/users/me/friends/${link._id}`, "DELETE")
                        }
                      >
                        {link.status === "accepted"
                          ? "Unfriend"
                          : incoming
                            ? "Decline"
                            : "Cancel"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}
    </Layout>
  );
}
