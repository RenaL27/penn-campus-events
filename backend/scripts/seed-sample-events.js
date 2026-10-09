// Adds clearly fictional events without changing existing users or event listings.
require("dotenv").config();
const mongoose = require("mongoose");
const { randomBytes } = require("node:crypto");
const User = require("../src/models/user");
const Event = require("../src/models/event");
const { CATEGORIES } = require("../src/services/discovery");
const entries = [
  [
    "Career Coffee & Resume Lab",
    0,
    "In-Person",
    "Houston Hall",
    "16:00",
    0,
    "Bring your resume for a relaxed peer review and practice introducing yourself.",
  ],
  [
    "Research Paths Panel",
    0,
    "Online",
    "Online — sample link pending",
    "18:00",
    5,
    "Explore undergraduate research opportunities and hear sample student project stories.",
  ],
  [
    "Campus Picnic & Board Games",
    1,
    "In-Person",
    "College Green",
    "13:00",
    2,
    "Meet other students over casual board games and a picnic.",
  ],
  [
    "Study Break Social",
    1,
    "Hybrid",
    "Houston Hall + online",
    "20:00",
    1,
    "Take a study break with conversation prompts and casual games.",
  ],
  [
    "Find Your Club Mixer",
    2,
    "In-Person",
    "Locust Walk",
    "15:00",
    3,
    "Discover student clubs and talk about ways to get involved.",
  ],
  [
    "Student Organization Workshop",
    2,
    "Online",
    "Online — sample link pending",
    "17:00",
    6,
    "Practice planning a club event, recruiting volunteers, and creating a budget.",
  ],
  [
    "Acoustic Open Mic",
    3,
    "In-Person",
    "The Rotunda",
    "19:00",
    2,
    "An evening of acoustic music, poetry, and student performances.",
  ],
  [
    "Photography Walk",
    3,
    "In-Person",
    "Meet at College Green",
    "14:00",
    9,
    "Bring a phone or camera and explore campus through photography.",
  ],
  [
    "Build a Tiny App Night",
    4,
    "Hybrid",
    "Engineering campus + online",
    "18:30",
    1,
    "Team up to prototype a small app. Beginners are welcome.",
  ],
  [
    "Casual Gaming Meetup",
    4,
    "Online",
    "Online — sample link pending",
    "20:00",
    8,
    "Join a friendly evening of casual multiplayer games.",
  ],
  [
    "Sunset Walk & Stretch",
    5,
    "In-Person",
    "Penn Park",
    "17:30",
    3,
    "Enjoy a gentle walk and stretching session with fellow students.",
  ],
  [
    "Mindful Study Break",
    5,
    "Hybrid",
    "Campus meeting room + online",
    "12:00",
    7,
    "Pause for breathing exercises and a quiet reflection session.",
  ],
  [
    "Culture & Conversation Cafe",
    6,
    "In-Person",
    "ARCH Building",
    "16:30",
    2,
    "Share stories about traditions, languages, and campus experiences.",
  ],
  [
    "Global Stories Discussion",
    6,
    "Online",
    "Online — sample link pending",
    "18:00",
    10,
    "Discuss student perspectives and stories from around the world.",
  ],
  [
    "Community Service Planning Circle",
    7,
    "In-Person",
    "Houston Hall",
    "11:00",
    3,
    "Brainstorm service projects and meet students interested in volunteering.",
  ],
  [
    "Volunteer Orientation",
    7,
    "Hybrid",
    "Campus meeting room + online",
    "15:30",
    12,
    "Learn about sample volunteer roles and plan a future service activity.",
  ],
];
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (mongoose.connection.name !== "penn-campus-events")
      throw new Error("Unexpected database; seed cancelled.");
    let host = await User.findOne({ username: "sample-events-host" });
    if (!host)
      host = await User.create({
        name: "Sample Events (Fictional)",
        username: "sample-events-host",
        email: "sample-events-host@example.test",
        password: randomBytes(48).toString("hex"),
      });
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    let added = 0;
    for (const [
      name,
      category,
      eventType,
      location,
      time,
      offset,
      description,
    ] of entries) {
      const title = `[Sample] ${name}`;
      if (await Event.exists({ organizer: host._id, title })) continue;
      const date = new Date(`${today}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + offset);
      await Event.create({
        title,
        category: CATEGORIES[category],
        eventType,
        location,
        time,
        date,
        capacity: 40,
        organizer: host._id,
        description: `SAMPLE EVENT — fictional listing for testing PennEvents. This is not an actual scheduled event. ${description}`,
        attendees: [],
        waitlist: [],
      });
      added++;
    }
    console.log(
      `Added ${added} sample events to ${mongoose.connection.name}. Existing events were preserved.`,
    );
  } catch (error) {
    console.error("Sample seed failed:", error.name);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
