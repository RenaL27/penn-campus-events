const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { CATEGORIES } = require("../services/discovery");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  passwordHashVersion: { type: Number, default: 0, select: false },
  avatar: { type: String, default: "" },
  interests: [{ type: String, enum: CATEGORIES }],
  interestsSet: { type: Boolean, default: false },
  searchHistory: [
    {
      query: String,
      searchedAt: { type: Date, default: Date.now },
      _id: false,
    },
  ],
  eventsAttending: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  eventsWaitlisted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
});
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordHashVersion = 1;
});
module.exports = mongoose.model("User", userSchema);
