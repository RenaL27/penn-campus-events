const mongoose = require("mongoose");
const { CATEGORIES, EVENT_TYPES } = require("../services/discovery");
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 10000 },
    date: { type: Date, required: true, index: true },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
    time: { type: String, required: true },
    location: { type: String, required: true, maxlength: 300 },
    category: { type: String, enum: CATEGORIES, index: true },
    eventType: { type: String, enum: EVENT_TYPES, default: "In-Person" },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);
module.exports = mongoose.model("Event", eventSchema);
