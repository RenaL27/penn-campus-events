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
  const [search, setSearch] = useState("");
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
    <Layout>
      <section className="hero">
        <div>
          <p className="eyebrow">PENN CAMPUS EVENTS</p>
          <h1>
            Campus events,
            <br />
            in one place.
          </h1>
          <p className="hero-description">
            Explore academic talks, student organizations, arts,
            <br className="desktop-break" /> and activities across Penn.
          </p>
          <form className="hero-search" action="/events">
            <Icon name="search" />
            <input
              aria-label="Search campus events"
              name="q"
              placeholder="Search events, topics, or organizations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button aria-label="Search events" type="submit">
              <Icon name="arrow" />
            </button>
          </form>
        </div>
        <aside className="campus-directory">
          <p className="eyebrow">EXPLORE BY INTEREST</p>
          <h2>Across campus</h2>
          <p>Browse opportunities to learn, participate, and get involved.</p>
          {[
            [
              "Academic & Career",
              "Talks, research, and professional development",
            ],
            ["Clubs & Organizations", "Student groups and campus involvement"],
            [
              "Arts & Media",
              "Performances, exhibitions, and creative workshops",
            ],
          ].map(([category, description]) => (
            <Link
              key={category}
              to={`/events?categories=${encodeURIComponent(category)}`}
            >
              <span>
                <strong>{category}</strong>
                <small>{description}</small>
              </span>
              <Icon name="arrow" size={18} />
            </Link>
          ))}
          <Link className="directory-all" to="/events">
            View all categories <Icon name="arrow" size={16} />
          </Link>
        </aside>
      </section>
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
        <div className="section-heading">
          <div>
            <p className="eyebrow">PERSONALIZED EVENTS</p>
            <h2>For you</h2>
          </div>
          <Link className="text-link" to="/preferences">
            Edit interests <Icon name="filter" size={16} />
          </Link>
        </div>
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
            ].map(([value, icon, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                className={tab === value ? "selected" : ""}
                onClick={() => setParams({ tab: value })}
              >
                <Icon name={icon} size={17} />
                {label}
              </button>
            ))}
          </div>
          <Link className="text-link browse-all" to="/events">
            Browse all events <Icon name="arrow" size={16} />
          </Link>
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
              <p className="feed-explanation">
                {tab === "friends"
                  ? "Upcoming events attended by your confirmed friends."
                  : loggedIn
                    ? "Picked from your interests, recent searches, past attendance, and what’s popular."
                    : "Browse upcoming campus events. Log in for personalized recommendations."}
              </p>
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
