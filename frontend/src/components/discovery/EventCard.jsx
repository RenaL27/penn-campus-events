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
        <p className="card-schedule"><Icon name="calendar" size={18} /><span>{eventDate(event.date)} · {eventTime(event.time)}</span></p>
        <p className="event-location"><Icon name="pin" size={18} /><span>{event.location}</span></p>
        {event.organizer?.name && (
          <p className="card-host"><Icon name="people" size={18} /><span>Hosted by {event.organizer.name}</span></p>
        )}
        {event.eventType && event.eventType !== "In-Person" && <p className="card-format">{event.eventType} event</p>}
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
        ) : event.attendanceCount > 0 ? (
          <p className="card-attendance"><Icon name="people" size={18} />{event.attendanceCount} attending</p>
        ) : null}
      </div>
    </article>
  );
}
