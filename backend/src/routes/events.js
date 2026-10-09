const router = require("express").Router();
const { notify } = require("../services/notifications");
const Event = require("../models/event");
const auth = require("../middleware/auth");
const {
  CATEGORIES,
  EVENT_TYPES,
  TIME_ZONE,
  escapeRegex,
  day,
  eventFields,
} = require("../services/discovery");
const { discover } = require("../services/feed");
router.get("/meta", (req, res) =>
  res.json({
    categories: CATEGORIES,
    eventTypes: EVENT_TYPES,
    timeZone: TIME_ZONE,
  }),
);
router.get("/discover", auth.optional, async (req, res) => {
  let events;
  try {
    events = await discover(req.query, req.user);
  } catch (err) {
    if (err.name === "Error" && /filter|sort|date/i.test(err.message))
      return res.status(400).json({ error: err.message });
    throw err;
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 12));
  res.json({
    events: events.slice((page - 1) * limit, page * limit),
    total: events.length,
    page,
    pages: Math.ceil(events.length / limit),
  });
});
// Keep the existing list contract for the dashboard and older clients.
router.get("/", async (req, res) => {
  const filters = {};
  if (req.query.date) {
    let start;
    try {
      start = day(req.query.date);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    filters.date = { $gte: start, $lt: new Date(start.getTime() + 86400000) };
  }
  if (req.query.time) filters.time = req.query.time;
  if (req.query.location)
    filters.location = new RegExp(escapeRegex(String(req.query.location)), "i");
  const events = await Event.find(filters)
    .populate("organizer", "name username avatar")
    .sort({ date: 1 });
  res.json(
    req.query.organizer
      ? events.filter((e) =>
          e.organizer?.name
            .toLowerCase()
            .includes(String(req.query.organizer).toLowerCase()),
        )
      : events,
  );
});
router.post("/create", auth, async (req, res) => {
  let fields;
  try {
    fields = eventFields(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const event = await Event.create({ ...fields, organizer: req.userId });
  res.status(201).json({
    message: "New event created successfully",
    eventId: event._id,
    userId: event._id,
  });
});
router.get("/:eventId", async (req, res) => {
  const event = await Event.findById(req.params.eventId).populate(
    "organizer attendees waitlist",
    "name username avatar",
  );
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});
router.put("/:eventId", auth, async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (String(event.organizer) !== req.userId)
    return res.status(403).json({ error: "You are not the organizer" });
  let fields;
  try {
    fields = eventFields(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (fields.capacity < event.attendees.length)
    return res
      .status(400)
      .json({ error: "Capacity cannot be below current attendance." });
  const previous = { ...event.toObject() };
  const previousAttendees = new Set(event.attendees.map(String));
  const changed = Object.keys(fields).some(key => String(fields[key]) !== String(event[key]));
  Object.assign(event, fields);
  while (event.attendees.length < event.capacity && event.waitlist.length)
    event.attendees.push(event.waitlist.shift());
  await event.save();
  const promoted = event.attendees.filter(id => !previousAttendees.has(String(id)));
  await notify(promoted, { kind: "promotion", title: "A place is available", message: `You are now registered for ${event.title}.`, href: `/events/${event._id}` });
  if (changed) await notify([...previous.attendees, ...previous.waitlist].filter(id => String(id) !== req.userId), { kind: "event_update", title: "Event updated", message: `The organizer updated ${event.title}. Review the latest details.`, href: `/events/${event._id}` });
  res.json({ message: "Event updated successfully", event });
});
router.post("/:eventId/rsvp", auth, async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const previousAttendees = new Set(event.attendees.map(String));
  let kind;
  let message;
  if (event.attendees.includes(req.userId)) {
    event.attendees = event.attendees.filter((id) => String(id) !== req.userId);
    if (event.waitlist.length) event.attendees.push(event.waitlist.shift());
    kind = "cancellation";
    message = "You have successfully unregistered from the event";
  } else if (event.waitlist.includes(req.userId)) {
    event.waitlist = event.waitlist.filter((id) => String(id) !== req.userId);
    kind = "cancellation";
    message = "You have been removed from the waitlist";
  } else if (event.attendees.length < event.capacity) {
    event.attendees.push(req.userId);
    kind = "registration";
    message = "Successfully registered for the event!";
  } else {
    event.waitlist.push(req.userId);
    kind = "waitlist";
    message = "Event is full. You have been added to the waitlist.";
  }
  await event.save();
  await notify([req.userId], { kind, title: { cancellation: "Registration cancelled", registration: "Registration confirmed", waitlist: "Added to waitlist" }[kind], message: `${message} — ${event.title}`, href: `/events/${event._id}` });
  await notify(event.attendees.filter(id => String(id) !== req.userId && !previousAttendees.has(String(id))), { kind: "promotion", title: "A place is available", message: `You are now registered for ${event.title}.`, href: `/events/${event._id}` });
  res.json({ message });
});
module.exports = router;
