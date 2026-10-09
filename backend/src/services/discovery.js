const CATEGORIES = [
  "Academic & Career",
  "Social & Campus Life",
  "Clubs & Organizations",
  "Arts & Media",
  "Gaming & Tech",
  "Fitness & Wellness",
  "Cultural & Diversity",
  "Volunteering & Service",
];
const EVENT_TYPES = ["In-Person", "Online", "Hybrid"];
const TIME_ZONE = "America/New_York";
const id = (value) => String(value?._id || value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function campusNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}
function day(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Choose a valid date.");
  const result = new Date(`${value}T00:00:00.000Z`);
  if (isNaN(result) || result.toISOString().slice(0, 10) !== value)
    throw new Error("Choose a valid date.");
  return result;
}
function dateRange(preset, date, now = new Date()) {
  if (!preset || preset === "any") return null;
  let start = day(campusNow(now).date);
  const add = (d, n) => new Date(d.getTime() + n * 86400000);
  if (preset === "date") start = day(date || "");
  else if (preset === "tomorrow") start = add(start, 1);
  else if (preset === "week")
    return { $gte: start, $lt: add(start, 7 - ((start.getUTCDay() + 6) % 7)) };
  else if (preset === "weekend") {
    // Saturday and Sunday, including today when already on the weekend.
    start = add(
      start,
      start.getUTCDay() === 0 ? -1 : (6 - start.getUTCDay() + 7) % 7,
    );
    return { $gte: start, $lt: add(start, 2) };
  } else if (preset !== "today") throw new Error("Unknown date filter.");
  return { $gte: start, $lt: add(start, 1) };
}
function upcoming(event, now = new Date()) {
  const current = campusNow(now);
  const date = new Date(event.date).toISOString().slice(0, 10);
  return (
    date > current.date ||
    (date === current.date && (event.time || "23:59") >= current.time)
  );
}
function popularity(event) {
  return (
    (event.attendees?.length || 0) * 4 +
    (event.waitlist?.length || 0) * 2 +
    (event.engagement?.likes || 0) +
    (event.engagement?.comments || 0) * 2 +
    (event.engagement?.shares || 0) * 3
  );
}
function rankEvents(
  events,
  { user, past = [], friends = [], query = "", sort = "relevance" } = {},
) {
  const friendIds = new Set(friends.map(id));
  const history = (user?.searchHistory || [])
    .slice(0, 10)
    .map((h) => h.query.toLowerCase());
  const pastCategories = new Set(past.map((e) => e.category).filter(Boolean));
  const interests = new Set(user?.interests || []);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const result = events.map((event) => {
    const text =
      `${event.title} ${event.description || ""} ${event.category || ""} ${event.location || ""} ${event.organizer?.name || ""}`.toLowerCase();
    const friendsGoing = (event.attendees || []).filter((u) =>
      friendIds.has(id(u)),
    );
    const reasons = [];
    let score = Math.log1p(popularity(event));
    if (interests.has(event.category)) {
      score += 12;
      reasons.push("Matches your interests");
    }
    if (pastCategories.has(event.category)) {
      score += 8;
      reasons.push("Similar to events you attended");
    }
    if (history.some((q) => text.includes(q))) {
      score += 6;
      reasons.push("Based on your recent searches");
    }
    if (friendsGoing.length) {
      score += Math.min(10, friendsGoing.length * 3);
      reasons.push("Your friends are going");
    }
    score += terms.reduce(
      (total, t) =>
        total +
        (event.title.toLowerCase().includes(t) ? 15 : text.includes(t) ? 5 : 0),
      0,
    );
    return {
      ...event,
      attendanceCount: event.attendees?.length || 0,
      friendsGoing,
      popularityScore: popularity(event),
      recommendationScore: score,
      reasons: reasons.length
        ? reasons
        : [popularity(event) ? "Popular on campus" : "Explore something new"],
    };
  });
  result.sort((a, b) => {
    const order =
      sort === "popularity"
        ? b.popularityScore - a.popularityScore
        : sort === "relevance"
          ? b.recommendationScore - a.recommendationScore
          : 0;
    return (
      order ||
      new Date(a.date) - new Date(b.date) ||
      (a.time || "").localeCompare(b.time || "") ||
      id(a).localeCompare(id(b))
    );
  });
  return result;
}
function eventFields(body) {
  const fields = {};
  for (const key of [
    "title",
    "description",
    "date",
    "time",
    "location",
    "capacity",
    "category",
    "eventType",
  ]) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  if (fields.date !== undefined)
    fields.date = day(String(fields.date).slice(0, 10));
  if (fields.capacity !== undefined) {
    fields.capacity = Number(fields.capacity);
    if (!Number.isInteger(fields.capacity) || fields.capacity < 1)
      throw new Error("Capacity must be a positive whole number.");
  }
  if (
    fields.time !== undefined &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(fields.time)
  )
    throw new Error("Choose a valid time.");
  if (fields.category && !CATEGORIES.includes(fields.category))
    throw new Error("Choose a valid category.");
  if (fields.eventType && !EVENT_TYPES.includes(fields.eventType))
    throw new Error("Choose a valid event type.");
  return fields;
}
module.exports = {
  CATEGORIES,
  EVENT_TYPES,
  TIME_ZONE,
  id,
  escapeRegex,
  campusNow,
  day,
  dateRange,
  upcoming,
  popularity,
  rankEvents,
  eventFields,
};
