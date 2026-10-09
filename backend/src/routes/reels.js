const router = require("express").Router();
const mongoose = require("mongoose");
const multer = require("multer");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const auth = require("../middleware/auth");
const Event = require("../models/event");
const Reel = require("../models/reel");
const Comment = require("../models/reelComment");
const { discover } = require("../services/feed");
const { id } = require("../services/discovery");
const bucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "reelVideos",
  });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1, fields: 2 },
  fileFilter: (req, file, cb) => {
    if (!["video/mp4", "video/webm"].includes(file.mimetype))
      return cb(
        Object.assign(new Error("Upload an MP4 or WebM video."), {
          status: 400,
        }),
      );
    cb(null, true);
  },
});
const summary = (reel, userId) => ({
  _id: reel._id,
  event: reel.event,
  author: reel.author,
  caption: reel.caption,
  videoUrl: `/reels/${reel._id}/video`,
  likeCount: reel.likes.length,
  shareCount: reel.shares.length,
  liked: reel.likes.some((u) => id(u) === userId),
  createdAt: reel.createdAt,
});
router.get("/", auth.optional, async (req, res) => {
  const events = await discover({ sort: "relevance" }, req.user);
  const eventMap = new Map(events.map((e) => [id(e), e]));
  const reels = await Reel.find({ event: { $in: events.map((e) => e._id) } })
    .populate("author", "name username avatar")
    .lean();
  const order = new Map(events.map((e, i) => [id(e), i]));
  reels.sort(
    (a, b) =>
      order.get(id(a.event)) - order.get(id(b.event)) ||
      new Date(b.createdAt) - new Date(a.createdAt),
  );
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const selected = reels.slice((page - 1) * 8, page * 8);
  const counts = await Comment.aggregate([
    { $match: { reel: { $in: selected.map((r) => r._id) } } },
    { $group: { _id: "$reel", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [id(c), c.count]));
  res.json({
    reels: selected.map((r) => ({
      ...summary(r, req.userId),
      event: eventMap.get(id(r.event)),
      commentCount: countMap.get(id(r)) || 0,
    })),
    pages: Math.ceil(reels.length / 8),
    page,
  });
});
router.post("/", auth, upload.single("video"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "Choose a video to upload." });
  const event = await Event.findById(req.body.eventId);
  if (!event) return res.status(404).json({ error: "Event not found." });
  if (String(event.organizer) !== req.userId)
    return res
      .status(403)
      .json({ error: "Only the organizer can publish an event Reel." });
  const bytes = req.file.buffer;
  const mp4 = bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp";
  const webm =
    bytes.length >= 4 &&
    bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (!(req.file.mimetype === "video/mp4" ? mp4 : webm))
    return res
      .status(400)
      .json({ error: "This file is not a valid MP4 or WebM container." });
  const caption = String(req.body.caption || "").trim();
  if (caption.length > 1000)
    return res
      .status(400)
      .json({ error: "Captions can contain up to 1,000 characters." });
  const stream = bucket().openUploadStream(`${event._id}-${Date.now()}`, {
    metadata: { mime: req.file.mimetype, owner: req.userId },
  });
  try {
    await pipeline(Readable.from(bytes), stream);
    const reel = await Reel.create({
      event: event._id,
      author: req.userId,
      caption,
      videoId: stream.id,
      mime: req.file.mimetype,
      size: bytes.length,
    });
    res.status(201).json(summary(reel, req.userId));
  } catch (error) {
    await bucket()
      .delete(stream.id)
      .catch(() => {});
    throw error;
  }
});
router.get("/:reelId/video", async (req, res) => {
  const reel = await Reel.findById(req.params.reelId);
  if (!reel) return res.status(404).json({ error: "Video not found." });
  let start = 0,
    end = reel.size - 1;
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!match || (!match[1] && !match[2]))
      return res.status(416).set("Content-Range", `bytes */${reel.size}`).end();
    if (!match[1]) start = Math.max(0, reel.size - Number(match[2]));
    else {
      start = Number(match[1]);
      if (match[2]) end = Math.min(end, Number(match[2]));
    }
    if (start > end || start >= reel.size)
      return res.status(416).set("Content-Range", `bytes */${reel.size}`).end();
    res.status(206).set("Content-Range", `bytes ${start}-${end}/${reel.size}`);
  }
  res.set({
    "Content-Type": reel.mime,
    "Content-Length": end - start + 1,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
  });
  const stream = bucket().openDownloadStream(reel.videoId, {
    start,
    end: end + 1,
  });
  await pipeline(stream, res).catch((err) => {
    if (!res.destroyed) res.destroy(err);
  });
});
router.get("/:reelId", auth.optional, async (req, res) => {
  const reel = await Reel.findById(req.params.reelId)
    .populate("author", "name username avatar")
    .populate("event");
  if (!reel) return res.status(404).json({ error: "Reel not found." });
  res.json({
    ...summary(reel, req.userId),
    commentCount: await Comment.countDocuments({ reel: reel._id }),
  });
});
router.put("/:reelId/like", auth, async (req, res) => {
  if (typeof req.body.liked !== "boolean")
    return res.status(400).json({ error: "Specify liked as true or false." });
  const reel = await Reel.findByIdAndUpdate(
    req.params.reelId,
    { [req.body.liked ? "$addToSet" : "$pull"]: { likes: req.userId } },
    { new: true },
  );
  if (!reel) return res.status(404).json({ error: "Reel not found." });
  res.json({ liked: req.body.liked, likeCount: reel.likes.length });
});
router.post("/:reelId/share", auth, async (req, res) => {
  const reel = await Reel.findByIdAndUpdate(
    req.params.reelId,
    { $addToSet: { shares: req.userId } },
    { new: true },
  );
  if (!reel) return res.status(404).json({ error: "Reel not found." });
  res.json({ shareCount: reel.shares.length });
});
router.get("/:reelId/comments", auth.optional, async (req, res) => {
  if (!(await Reel.exists({ _id: req.params.reelId })))
    return res.status(404).json({ error: "Reel not found." });
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const comments = await Comment.find({ reel: req.params.reelId })
    .populate("author", "name username avatar")
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * 20)
    .limit(20)
    .lean();
  res.json({
    comments: comments.map(({ likes, ...c }) => ({
      ...c,
      likeCount: likes.length,
      liked: likes.some((u) => id(u) === req.userId),
    })),
    total: await Comment.countDocuments({ reel: req.params.reelId }),
    page,
  });
});
router.post("/:reelId/comments", auth, async (req, res) => {
  if (!(await Reel.exists({ _id: req.params.reelId })))
    return res.status(404).json({ error: "Reel not found." });
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  if (!text || text.length > 1000)
    return res
      .status(400)
      .json({ error: "Write a comment between 1 and 1,000 characters." });
  const comment = await Comment.create({
    reel: req.params.reelId,
    author: req.userId,
    text,
  });
  res.status(201).json({
    ...comment.toObject(),
    author: { _id: req.userId, name: req.user.name, avatar: req.user.avatar },
    liked: false,
    likeCount: 0,
  });
});
router.put("/:reelId/comments/:commentId/like", auth, async (req, res) => {
  if (typeof req.body.liked !== "boolean")
    return res.status(400).json({ error: "Specify liked as true or false." });
  const comment = await Comment.findOneAndUpdate(
    { _id: req.params.commentId, reel: req.params.reelId },
    { [req.body.liked ? "$addToSet" : "$pull"]: { likes: req.userId } },
    { new: true },
  );
  if (!comment) return res.status(404).json({ error: "Comment not found." });
  res.json({ liked: req.body.liked, likeCount: comment.likes.length });
});
module.exports = router;
