import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, isLoggedIn } from "../utils/api";
import {
  readFilters,
  searchParams,
  EMPTY_FILTERS,
  DATE_PRESETS,
} from "../utils/discovery";
import Layout from "../components/discovery/Layout";
import Icon from "../components/discovery/Icon";
import Filters from "../components/discovery/Filters";
import EventCard from "../components/discovery/EventCard";
import {
  ErrorMessage,
  EmptyState,
  Loading,
  Pagination,
} from "../components/discovery/Feedback";
function guestHistory() {
  try {
    return JSON.parse(localStorage.getItem("penn-searches") || "[]");
  } catch {
    return [];
  }
}
export default function Events() {
  const [params, setParams] = useSearchParams();
  const queryString = params.toString();
  const q = params.get("q") || "";
  const page = Math.max(1, parseInt(params.get("page"), 10) || 1);
  const applied = readFilters(params);
  const [input, setInput] = useState(q);
  const [draft, setDraft] = useState(applied);
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState({ events: [], total: 0, pages: 0 });
  const [trending, setTrending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [loading, setLoading] = useState(true);
  const loggedIn = isLoggedIn();
  useEffect(() => {
    setInput(q);
    setDraft(readFilters(new URLSearchParams(queryString)));
  }, [q, queryString]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api(`/events/discover?${queryString}`, "GET", null, true, controller.signal)
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [queryString]);
  useEffect(() => {
    const controller = new AbortController();
    api(
      "/events/discover?sort=popularity&limit=3",
      "GET",
      null,
      true,
      controller.signal,
    )
      .then((d) => setTrending(d.events))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    let active = true;
    if (loggedIn) {
      const request = q.trim()
        ? api("/users/me/searches", "POST", { query: q })
        : api("/users/me").then((u) => u.searchHistory);
      request
        .then((h) => {
          if (active) setHistory(h);
        })
        .catch((e) => {
          if (active) setHistoryError(e.message);
        });
    } else {
      let h = guestHistory();
      if (q.trim()) {
        h = [
          { query: q.trim(), searchedAt: new Date().toISOString() },
          ...h.filter((s) => s.query.toLowerCase() !== q.trim().toLowerCase()),
        ].slice(0, 10);
        localStorage.setItem("penn-searches", JSON.stringify(h));
      }
      setHistory(h);
    }
    return () => {
      active = false;
    };
  }, [q, loggedIn]);
  const apply = (filters = draft, term = input) => {
    setParams(searchParams(term, filters));
    setShowFilters(false);
  };
  const clearHistory = async () => {
    try {
      if (loggedIn) await api("/users/me/searches", "DELETE");
      else localStorage.removeItem("penn-searches");
      setHistory([]);
      setHistoryError("");
    } catch (e) {
      setHistoryError(e.message);
    }
  };
  const chips = [];
  for (const key of ["categories", "types"])
    for (const value of applied[key])
      chips.push({
        label: value,
        remove: () =>
          apply(
            { ...applied, [key]: applied[key].filter((x) => x !== value) },
            q,
          ),
      });
  if (applied.datePreset !== "any")
    chips.push({
      label:
        applied.datePreset === "date"
          ? applied.date
          : DATE_PRESETS[applied.datePreset],
      remove: () => apply({ ...applied, datePreset: "any", date: "" }, q),
    });
  if (applied.friends)
    chips.push({
      label: "Friends going",
      remove: () => apply({ ...applied, friends: false }, q),
    });
  for (const key of ["location", "organizer", "time"])
    if (applied[key])
      chips.push({
        label: `${key}: ${applied[key]}`,
        remove: () => apply({ ...applied, [key]: "" }, q),
      });
  return (
    <Layout>
      <div className="page-intro">
        <p className="eyebrow">EVENT DIRECTORY</p>
        <h1>Browse events</h1>
        <p>Find campus events by topic, date, format, and organization.</p>
      </div>
      <div className="search-toolbar">
        <form
          className="search-box"
          onSubmit={(e) => {
            e.preventDefault();
            apply(applied);
          }}
        >
          <Icon name="search" />
          <input
            aria-label="Search events"
            placeholder="Search events, interests, or organizers"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="button button-small" type="submit">
            Search
          </button>
        </form>
        <button
          className={`button button-outline ${showFilters ? "selected" : ""}`}
          aria-expanded={showFilters}
          onClick={() => {
            if (!showFilters) setDraft(applied);
            setShowFilters(!showFilters);
          }}
        >
          <Icon name="filter" />
          Filters{chips.length ? ` (${chips.length})` : ""}
        </button>
      </div>
      {showFilters && (
        <Filters
          value={draft}
          onChange={setDraft}
          onApply={() => apply()}
          onReset={() => apply({ ...EMPTY_FILTERS }, q)}
          loggedIn={loggedIn}
        />
      )}
      <div className="filter-chips">
        {chips.map((c) => (
          <button
            key={c.label}
            className="chip"
            onClick={c.remove}
            aria-label={`Remove ${c.label} filter`}
          >
            {c.label} <span>×</span>
          </button>
        ))}
        {chips.length > 0 && (
          <button
            className="text-button"
            onClick={() => apply({ ...EMPTY_FILTERS }, q)}
          >
            Clear filters
          </button>
        )}
      </div>
      {!q && !chips.length && (
        <section className="search-discovery">
          <div className="recent-panel">
            <div className="section-heading">
              <h2>Recent searches</h2>
              {history.length > 0 && (
                <button className="text-button" onClick={clearHistory}>
                  Clear
                </button>
              )}
            </div>
            <ErrorMessage error={historyError} />
            {history.length ? (
              history.map((h) => (
                <button
                  className="recent-search"
                  key={h.query}
                  onClick={() => apply(applied, h.query)}
                >
                  <Icon name="search" size={16} />
                  {h.query}
                  <Icon name="arrow" size={14} />
                </button>
              ))
            ) : (
              <p className="muted">
                No recent searches. Search by event title, topic, or
                organization.
              </p>
            )}
          </div>
          <div className="trending-panel">
            <div className="section-heading">
              <h2>Trending at Penn</h2>
              <span className="small-label">Campus favorites</span>
            </div>
            <p className="field-hint">
              Ranked by RSVPs, waitlists, and Reel engagement.
            </p>
            {trending.length ? (
              trending.map((event, i) => (
                <Link
                  className="trending-row"
                  to={`/events/${event._id}`}
                  key={event._id}
                >
                  <span className="trend-number">0{i + 1}</span>
                  <span>
                    <strong>{event.title}</strong>
                    <small>
                      {event.category || "Campus event"} ·{" "}
                      {event.attendanceCount} going
                    </small>
                  </span>
                  <Icon name="arrow" size={18} />
                </Link>
              ))
            ) : (
              <p className="muted">No trending events to display.</p>
            )}
          </div>
        </section>
      )}
      <div className="results-heading">
        <h2>
          {q ? `Results for “${q}”` : "Upcoming events"}
          <span>{!loading && !error ? ` ${data.total}` : ""}</span>
        </h2>
        <label>
          Sort by{" "}
          <select
            aria-label="Sort events"
            value={applied.sort}
            onChange={(e) => apply({ ...applied, sort: e.target.value }, q)}
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="popularity">Popularity</option>
          </select>
        </label>
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : (
        !error &&
        (data.events.length ? (
          <>
            <div className="event-grid">
              {data.events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={data.pages}
              onChange={(value) => setParams(searchParams(q, applied, value))}
            />
          </>
        ) : (
          <EmptyState title="No plans match just yet">
            Try another search or clear a filter to see more events.
          </EmptyState>
        ))
      )}
    </Layout>
  );
}
