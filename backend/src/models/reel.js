const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Reel",
  new mongoose.Schema(
    {
      event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
        index: true,
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      caption: { type: String, maxlength: 1000, default: "" },
      videoId: { type: mongoose.Schema.Types.ObjectId, required: true },
      mime: { type: String, required: true },
      size: { type: Number, required: true },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      shares: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true },
  ),
);
