const router = require("express").Router();
const Event = require("../models/event");
const User = require("../models/user");
const auth = require("../middleware/auth");

router.post("/create", auth, async (req, res) => {
  try {
    const { title, description, date, capacity } = req.body;
    if (capacity <= 0) {
      return res.status(400).json({ error: "Invalid Capacity" });
    }
    const newEvent = new Event({
      title: title,
      description: description,
      date: date,
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
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (event.attendees.length >= event.capacity) {
      await Event.updateOne({ _id: eventId }, { $push: { waitlist: req.userId } });
      await User.updateOne({ _id: req.userId }, { $push: { eventsWaitlisted: eventId } });
      res.status(201).json({
        message: "Added to waitlist",
      });
    } else {
      await Event.updateOne({ _id: eventId }, { $push: { attendees: req.userId } });
      await User.updateOne({ _id: req.userId }, { $push: { eventsAttending: eventId } });
      res.status(201).json({
        message: "Added to attendee list",
      });
    }
  } catch (error) {
    console.error('Error rsvping for the event:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
