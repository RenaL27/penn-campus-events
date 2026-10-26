import { useState } from "react";
import { Link } from "react-router-dom";
import { eventDate, eventTime } from "../../utils/api";
import { eventArtwork } from "../../utils/artwork";
import Icon from "./Icon";
export function Avatar({ user, small = false }) {
  const initials = (user?.name || "Student")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  return (
    <span
      className={`avatar ${small ? "avatar-small" : ""}`}
      title={user?.name}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        initials
      )}
    </span>
  );
}
export default function EventCard({ event, compact = false }) {
  const [message, setMessage] = useState("");
  const friends = event.friendsGoing || [];
  async function share() {
    const url = `${window.location.origin}/events/${event._id}`;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied");
      } else setMessage(url);
    } catch (e) {
      if (e.name !== "AbortError") setMessage(url);
    }
  }
  return (
    <article className={`event-card ${compact ? "event-card-compact" : ""}`}>
      <Link
        to={`/events/${event._id}`}
        className="event-art"
        aria-label={`View ${event.title}`}
      >
        <img src={eventArtwork(event)} alt="" loading="lazy" />
      </Link>
      <div className="event-card-body">
        <div className="card-title-row">
          <h2>
            <Link to={`/events/${event._id}`}>{event.title}</Link>
          </h2>
          <button onClick={share} aria-label={`Share ${event.title}`}>
            <Icon name="share" size={18} />
          </button>
        </div>
        <p>
          {eventDate(event.date)} · {eventTime(event.time)} · {event.location}
        </p>
        <p>{event.organizer?.name || "Campus organizer"}</p>
        {event.eventType && event.eventType !== "In-Person" && (
          <p>{event.eventType}</p>
        )}
        {friends.length > 0 && (
          <div className="friend-attendance">
            <span className="avatar-stack">
              {friends.slice(0, 3).map((f) => (
                <Avatar key={f._id} user={f} small />
              ))}
            </span>
            <span>
              {friends[0].name}
              {friends.length > 1
                ? ` and ${friends.length - 1} friend${friends.length > 2 ? "s" : ""}`
                : ""}{" "}
              going
            </span>
          </div>
        )}
        {message && (
          <p role="status" className="share-message">
            {message}
          </p>
        )}
      </div>
    </article>
  );
}
