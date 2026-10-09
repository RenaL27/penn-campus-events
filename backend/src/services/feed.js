const Event = require("../models/event");
const Friendship = require("../models/friendship");
const Reel = require("../models/reel");
const ReelComment = require("../models/reelComment");
const {
  CATEGORIES,
  EVENT_TYPES,
  escapeRegex,
  dateRange,
  upcoming,
  rankEvents,
  id,
} = require("./discovery");
async function friendIds(userId) {
  if (!userId) return [];
  const links = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  }).lean();
  return links.map((f) =>
    id(f.requester) === userId ? f.recipient : f.requester,
  );
}
async function discover(query, user) {
  const list = (value, allowed) => {
    if (value === undefined || value === "") return [];
    if (typeof value !== "string") throw new Error("Invalid filter.");
    const values = value.split(",");
    if (values.some((v) => !allowed.includes(v)))
      throw new Error("Invalid filter option.");
    return values;
  };
  const categories = list(query.categories, CATEGORIES);
  const types = list(query.types, EVENT_TYPES);
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 120) : "";
  const sort = query.sort || "relevance";
  if (!["relevance", "date", "popularity"].includes(sort))
    throw new Error("Invalid sort order.");
  const filters = {};
  if (categories.length) filters.category = { $in: categories };
  if (types.length) {
    if (types.includes("In-Person"))
      filters.$or = [
        { eventType: { $in: types } },
        { eventType: { $exists: false } },
      ];
    else filters.eventType = { $in: types };
  }
  const range = dateRange(query.datePreset, query.date);
  if (range) filters.date = range;
  const friends = await friendIds(user ? id(user) : null);
  if (query.friends === "true") filters.attendees = { $in: friends };
  let events = await Event.find(filters)
    .populate("organizer", "name username avatar")
    .populate("attendees", "name username avatar")
    .lean();
  events = events.filter((e) => e.date && upcoming(e));
  if (q) {
    const words = q.toLowerCase().split(/\s+/);
    events = events.filter((e) => {
      const text =
        `${e.title} ${e.description || ""} ${e.location || ""} ${e.category || ""} ${e.organizer?.name || ""}`.toLowerCase();
      return words.every((word) => text.includes(word));
    });
  }
  if (query.location)
    events = events.filter((e) =>
      new RegExp(escapeRegex(String(query.location)), "i").test(e.location),
    );
  if (query.organizer)
    events = events.filter((e) =>
      new RegExp(escapeRegex(String(query.organizer)), "i").test(
        e.organizer?.name || "",
      ),
    );
  if (query.time) events = events.filter((e) => e.time === query.time);
  const eventIds = events.map((e) => e._id);
  const reels = await Reel.find({ event: { $in: eventIds } })
    .select("event likes shares")
    .lean();
  const comments = await ReelComment.aggregate([
    { $match: { reel: { $in: reels.map((r) => r._id) } } },
    { $group: { _id: "$reel", count: { $sum: 1 } } },
  ]);
  const counts = new Map(comments.map((c) => [id(c), c.count]));
  const engagement = new Map();
  for (const reel of reels) {
    const key = id(reel.event);
    const value = engagement.get(key) || { likes: 0, shares: 0, comments: 0 };
    value.likes += reel.likes.length;
    value.shares += reel.shares.length;
    value.comments += counts.get(id(reel)) || 0;
    engagement.set(key, value);
  }
  const past = user
    ? (
        await Event.find({ attendees: user._id })
          .select("date time category")
          .lean()
      ).filter((e) => e.date && !upcoming(e))
    : [];
  return rankEvents(
    events.map((e) => ({ ...e, engagement: engagement.get(id(e)) })),
    { user, past, friends, query: q, sort },
  ).map(({ attendees, waitlist, ...event }) => ({
    ...event,
    waitlistCount: waitlist?.length || 0,
  }));
}
module.exports = { discover, friendIds };
