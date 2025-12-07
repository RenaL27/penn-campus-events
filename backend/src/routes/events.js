const router = require("express").Router();
const Event = require("../models/event");
const User = require("../models/user");
const auth = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const { date, time, location, organizer } = req.query;

    let filters = {};

    if (date) filters.date = { $gte: new Date(date), $lte: new Date(date) };
    if (time) filters.time = time;
    if (location) filters.location = new RegExp(location, "i");
    if (organizer) filters.organizer = organizer;

    const events = await Event.find(filters)
      .populate("organizer", "name username")
      .sort({ date: 1 });

    res.json(events);

  } catch (error) {
    console.error("Error loading events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Only for organizer
router.put("/:eventId", auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, date, time, location, capacity } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: "You are not the organizer" });
    }

    event.title = title;
    event.description = description;
    event.date = date;
    event.time = time;
    event.location = location;
    event.capacity = capacity;

    await event.save();

    res.json({ message: "Event updated successfully", event });

  } catch (err) {
    console.error("Edit event error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET event by ID
router.get("/:eventId", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate("organizer", "name username")
      .populate("attendees", "name username")
      .populate("waitlist", "name username");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);

  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create", auth, async (req, res) => {
  try {
    const { title, description, date, capacity, location, time } = req.body;
    if (capacity <= 0) {
      return res.status(400).json({ error: "Invalid Capacity" });
    }
    const newEvent = new Event({
      title: title,
      description: description,
      date: date,
      location: location,
      time: time,
      capacity: capacity,
      attendees: [],
      waitlist: [],
      organizer: req.userId
    })

    await newEvent.save();

    res.status(201).json({
        message: "New event created successfully",
        userId: newEvent._id
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post("/:eventId/rsvp", auth, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const isAttending = event.attendees.includes(userId);
    const isWaitlisted = event.waitlist.includes(userId);

    if (isAttending) {
      event.attendees = event.attendees.filter((id) => id.toString() !== userId);
      
      if (event.waitlist.length > 0) {
        const nextUser = event.waitlist.shift();
        event.attendees.push(nextUser);
      }

      await event.save();
      return res.json({ message: "You have successfully unregistered from the event" });
    }

    if (isWaitlisted) {
      return res.status(400).json({ error: "You are already waitlisted for this event" });
    }

    if (event.attendees.length < event.capacity) {
      event.attendees.push(userId);
      await event.save();
      return res.json({ message: "Successfully registered for the event!" });
    }

    event.waitlist.push(userId);
    await event.save();

    res.json({
      message: "Event is full. You have been added to the waitlist."
    });

  } catch (error) {
    console.error("RSVP error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
