import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, isLoggedIn } from "../utils/api";
import Layout from "../components/discovery/Layout";
import Icon from "../components/discovery/Icon";
import EventCard from "../components/discovery/EventCard";
import {
  ErrorMessage,
  EmptyState,
  Loading,
  Pagination,
} from "../components/discovery/Feedback";
import Reels from "../components/discovery/Reels";
export default function Home() {
  const [params, setParams] = useSearchParams();
  const tab = ["recommended", "friends", "reels"].includes(params.get("tab"))
    ? params.get("tab")
    : "recommended";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [data, setData] = useState({ events: [], pages: 0 });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  useEffect(() => {
    if (tab === "reels" || (tab === "friends" && !loggedIn)) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api(
      `/events/discover?sort=relevance&page=${page}${tab === "friends" ? "&friends=true" : ""}`,
      "GET",
      null,
      true,
      controller.signal,
    )
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tab, page, loggedIn]);
  return (
    <Layout title="Discover Events">
      {loggedIn && user && !user.interestsSet && (
        <div className="interest-banner">
          <Icon name="spark" />
          <div>
            <strong>Personalize your recommendations.</strong>
            <p>Select interests to see relevant campus events.</p>
          </div>
          <Link className="button button-small" to="/preferences">
            Choose interests <Icon name="arrow" size={16} />
          </Link>
        </div>
      )}
      <section className="feed-section">
        <div className="feed-toolbar">
          <div
            className="feed-tabs"
            role="tablist"
            aria-label="Discovery feeds"
          >
            {[
              ["recommended", "spark", "Recommended"],
              ["friends", "people", "Friends Going"],
              ["reels", "play", "Reels"],
            ].map(([value, , label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                className={tab === value ? "selected" : ""}
                onClick={() => setParams({ tab: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ErrorMessage error={error} />
        {tab === "reels" ? (
          <Reels />
        ) : tab === "friends" && !loggedIn ? (
          <EmptyState title="Friends Going" link="/login" label="Log in">
            Log in to see where your friends are going.
          </EmptyState>
        ) : loading ? (
          <Loading />
        ) : (
          !error && (
            <>
              {data.events.length ? (
                <div className="event-grid">
                  {data.events.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={
                    tab === "friends"
                      ? "No upcoming events from friends"
                      : "No upcoming events"
                  }
                  link={tab === "friends" ? "/friends" : "/create"}
                  label={tab === "friends" ? "Find friends" : "Host an event"}
                >
                  {tab === "friends"
                    ? "Add friends, then check back when they RSVP to an upcoming event."
                    : "There are no upcoming events to display."}
                </EmptyState>
              )}
              <Pagination
                page={page}
                pages={data.pages}
                onChange={(value) => setParams({ tab, page: String(value) })}
              />
            </>
          )
        )}
      </section>
    </Layout>
  );
}
