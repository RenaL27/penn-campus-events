const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: String,
    date: Date,
    capacity: Number,
    time: String,
    location: String,
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model('Event', eventSchema);