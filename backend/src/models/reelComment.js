const mongoose = require("mongoose");
module.exports = mongoose.model(
  "ReelComment",
  new mongoose.Schema(
    {
      reel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reel",
        required: true,
        index: true,
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: { type: String, required: true, trim: true, maxlength: 1000 },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true },
  ),
);
