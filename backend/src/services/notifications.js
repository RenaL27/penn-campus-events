const Notification = require('../models/notification');
// Notification delivery must not turn an already-saved action into an error.
async function notify(recipients, details) {
  const ids = [...new Set(recipients.filter(Boolean).map(String))];
  if (!ids.length) return;
  try { await Notification.insertMany(ids.map(recipient => ({ recipient, ...details }))); }
  catch (error) { console.error('Notification delivery failed:', error.name); }
}
module.exports = { notify };
