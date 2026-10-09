const router = require('express').Router();
const Notification = require('../models/notification');
router.use(require('../middleware/auth'));
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const filter = { recipient: req.userId };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  res.json({ items, total, unread, page, pages: Math.ceil(total / 20) });
});
router.get('/unread', async (req, res) => {
  res.json({ unread: await Notification.countDocuments({ recipient: req.userId, readAt: null }) });
});
router.put('/read-all', async (req, res) => {
  await Notification.updateMany({ recipient: req.userId, readAt: null }, { $set: { readAt: new Date() } });
  res.sendStatus(204);
});
router.put('/:id/read', async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.userId, readAt: null }, { readAt: new Date() }, { new: true });
  if (!item && !(await Notification.exists({ _id: req.params.id, recipient: req.userId }))) return res.status(404).json({ error: 'Notification not found.' });
  res.sendStatus(204);
});
module.exports = router;
