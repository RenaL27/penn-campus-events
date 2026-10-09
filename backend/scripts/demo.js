// Isolated, disposable local demo. Never connects to MONGO_URI or modifies real data.
const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const mongoose = require("mongoose");
const { randomBytes } = require("node:crypto");
process.env.MONGOMS_DOWNLOAD_DIR ||= path.join(
  require("node:os").tmpdir(),
  "penn-events-mongodb-binaries",
);
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.CLIENT_ORIGIN = "http://localhost:3000";
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/user");
const Event = require("../src/models/event");
const Friendship = require("../src/models/friendship");
const { CATEGORIES } = require("../src/services/discovery");
(async () => {
  const mongo = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 },
  });
  await mongoose.connect(mongo.getUri());
  const [student, friend, host] = await User.create([
    {
      name: "Alex Chen",
      username: "alex",
      email: "alex@example.test",
      password: "campus-demo",
      interests: ["Arts & Media", "Academic & Career"],
      interestsSet: true,
    },
    {
      name: "Maya Rivera",
      username: "maya",
      email: "maya@example.test",
      password: "campus-demo",
    },
    {
      name: "Penn Community",
      username: "host",
      email: "host@example.test",
      password: "campus-demo",
    },
  ]);
  await Friendship.create({
    pair: [String(student._id), String(friend._id)].sort().join(":"),
    requester: student._id,
    recipient: friend._id,
    status: "accepted",
  });
  const titles = [
    "Ideas worth sharing",
    "A little live jazz",
    "Coffee & connections",
    "Make something together",
    "An evening of new perspectives",
    "Take a breath. Take a walk.",
    "Find your next community",
    "Give a little. Get together.",
  ];
  const categories = [0, 3, 1, 4, 6, 5, 2, 7];
  const locations = [
    "Houston Hall",
    "The Rotunda",
    "Locust Walk",
    "Engineering Green",
    "ARCH Building",
    "Penn Park",
    "College Green",
    "Campus Center",
  ];
  for (let i = 0; i < titles.length; i++)
    await Event.create({
      title: titles[i],
      description:
        "A sample campus event for exploring PennEvents. These demo plans are not real event listings.",
      date: new Date(Date.now() + (i + 1) * 86400000)
        .toISOString()
        .slice(0, 10),
      time: i % 2 ? "18:30" : "14:00",
      capacity: 40,
      category: CATEGORIES[categories[i]],
      eventType: ["In-Person", "Hybrid", "Online"][i % 3],
      location: locations[i],
      organizer: i === 0 ? student._id : host._id,
      attendees: i % 2 ? [friend._id] : [friend._id, host._id],
    });
  const apiServer = app.listen(8080, () =>
    console.log("Demo API: http://localhost:8080"),
  );
  let webServer;
  const build = path.resolve(__dirname, "../../frontend/build");
  if (fs.existsSync(path.join(build, "index.html"))) {
    const web = express();
    web.use(express.static(build));
    web.use((req, res) => res.sendFile(path.join(build, "index.html")));
    webServer = web.listen(3000, () =>
      console.log("Demo app: http://localhost:3000"),
    );
  } else console.log("Start the frontend separately with npm start.");
  console.log(
    "Demo login: alex / campus-demo (also maya or host with the same password).",
  );
  const stop = async () => {
    apiServer.close();
    webServer?.close();
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
