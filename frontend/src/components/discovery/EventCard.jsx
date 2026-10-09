import { Link } from "react-router-dom";
import { eventDate, eventTime } from "../../utils/api";
import { CATEGORIES } from "../../utils/discovery";
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
  const index = Math.max(0, CATEGORIES.indexOf(event.category));
  const friends = event.friendsGoing || [];
  const date = new Date(event.date);
  const month = date.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const day = date.toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: "UTC",
  });
  return (
    <article className={`event-card ${compact ? "event-card-compact" : ""}`}>
      <Link
        to={`/events/${event._id}`}
        className={`event-art art-${index % 4}`}
        aria-label={`View ${event.title}`}
      >
        <div className="event-cover-top">
          <span className="art-category">
            {event.category || "Campus event"}
          </span>
          <span className="event-date-badge">
            <span>{month}</span>
            <strong>{day}</strong>
          </span>
        </div>
        <div className="event-cover-bottom">
          <span className="art-title">{event.title}</span>
          <span className="art-arrow">
            <Icon name="arrow" />
          </span>
        </div>
      </Link>
      <div className="event-card-body">
        <div className="event-eyebrow">
          <span>
            {eventDate(event.date)} · {eventTime(event.time)}
          </span>
          <span className="type-tag">{event.eventType || "In-Person"}</span>
        </div>
        <Link className="event-title" to={`/events/${event._id}`}>
          {event.title}
        </Link>
        <p className="event-location">
          <Icon name="pin" size={14} />
          {event.location}
        </p>
        <p className="event-organizer">
          {event.organizer?.name || "Campus community"}
          <span>{event.attendanceCount || 0} going</span>
        </p>
        {friends.length ? (
          <div className="friend-attendance">
            <span className="avatar-stack">
              {friends.slice(0, 3).map((f) => (
                <Avatar key={f._id} user={f} small />
              ))}
            </span>
            <span>
              {friends[0].name}
              {friends.length > 1
                ? ` + ${friends.length - 1} friend${friends.length > 2 ? "s" : ""}`
                : ""}{" "}
              going
            </span>
          </div>
        ) : (
          <p className="recommendation-reason">
            <Icon name="spark" size={13} />
            {event.reasons?.[0] || "Upcoming campus event"}
          </p>
        )}
      </div>
    </article>
  );
}
