const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  href: { type: String, required: true },
  readAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ recipient: 1, createdAt: -1 });
schema.index({ recipient: 1, readAt: 1 });
module.exports = mongoose.model('Notification', schema);
