const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Friendship",
  new mongoose.Schema(
    {
      pair: { type: String, unique: true, required: true },
      requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      status: {
        type: String,
        enum: ["pending", "accepted"],
        default: "pending",
      },
    },
    { timestamps: true },
  ),
);
