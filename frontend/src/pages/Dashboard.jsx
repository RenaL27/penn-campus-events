import { useEffect, useState } from "react";
import Layout from "../components/discovery/Layout";
import EventCard from "../components/discovery/EventCard";
import { ErrorMessage, Loading } from "../components/discovery/Feedback";
import { api, eventTime } from "../utils/api";

// Calendar days use Philadelphia time, matching the event discovery filters.
export const campusToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function weekDays(selected) {
  const day = new Date(`${selected}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - day.getUTCDay());
  return Array.from({ length: 7 }, (_, i) => {
    const next = new Date(day);
    next.setUTCDate(day.getUTCDate() + i);
    return next.toISOString().slice(0, 10);
  });
}
export default function Dashboard() {
  const [date, setDate] = useState(campusToday);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("day");
  const userId = localStorage.getItem("userId");
  useEffect(() => {
    const controller = new AbortController();
    api("/events", "GET", null, true, controller.signal)
      .then(setEvents)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  const member = (list) => (list || []).some((u) => (u._id || u) === userId);
  const registered = events.filter(
    (e) => member(e.attendees) || member(e.waitlist),
  );
  const selected = (
    view === "hosting"
      ? events.filter((e) => (e.organizer?._id || e.organizer) === userId)
      : registered.filter((e) => view === "all" || e.date.slice(0, 10) === date)
  ).sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );
  return (
    <Layout>
      <section className="calendar-heading">
        <div>
          <p>
            {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            })}
          </p>
          <h2>
            {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </h2>
        </div>
        <label className="calendar-picker">
          Choose date
          <input
            aria-label="Choose calendar date"
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) {
                setDate(e.target.value);
                setView("day");
              }
            }}
          />
        </label>
      </section>
      <div className="calendar-week">
        {weekDays(date).map((day) => (
          <button
            key={day}
            className={day === date ? "selected" : ""}
            aria-pressed={day === date}
            aria-label={day}
            onClick={() => {
              setDate(day);
              setView("day");
            }}
          >
            <span>
              {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
                weekday: "short",
                timeZone: "UTC",
              })}
            </span>
            <strong>{Number(day.slice(-2))}</strong>
            <i
              className={
                registered.some((e) => e.date.startsWith(day))
                  ? "has-events"
                  : ""
              }
            />
          </button>
        ))}
      </div>
      <div className="calendar-tabs">
        {[
          ["day", "Selected day"],
          ["all", "All registrations"],
          ["hosting", "Hosting"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={view === value}
            className={view === value ? "selected" : ""}
            onClick={() => setView(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : (
        !error &&
        (selected.length ? (
          selected.map((event) => (
            <section className="agenda-item" key={event._id}>
              <h3>
                {eventTime(event.time)}{" "}
                {member(event.waitlist) && <span>Waitlisted</span>}
              </h3>
              <EventCard event={event} compact />
            </section>
          ))
        ) : (
          <p className="calendar-empty">
            {view === "hosting"
              ? "Events you create will appear here."
              : "No registrations for this view. Find an event and register to add it to your calendar."}
          </p>
        ))
      )}
    </Layout>
  );
}
