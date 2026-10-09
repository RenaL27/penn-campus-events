const router = require("express").Router();
const { notify } = require("../services/notifications");
const User = require("../models/user");
const Friendship = require("../models/friendship");
const auth = require("../middleware/auth");
const { CATEGORIES, escapeRegex } = require("../services/discovery");
router.use(auth);
router.get("/me", (req, res) => res.json(req.user));
router.put("/me/interests", async (req, res) => {
  const { interests } = req.body;
  if (
    !Array.isArray(interests) ||
    interests.some((i) => !CATEGORIES.includes(i))
  )
    return res
      .status(400)
      .json({ error: "Choose interests from the available categories." });
  const user = await User.findByIdAndUpdate(
    req.userId,
    { interests: [...new Set(interests)], interestsSet: true },
    { new: true },
  ).select("-password");
  res.json(user);
});
router.post("/me/searches", async (req, res) => {
  const query =
    typeof req.body.query === "string"
      ? req.body.query.trim().slice(0, 120)
      : "";
  if (!query) return res.status(400).json({ error: "Enter a search term." });
  // One pipeline update keeps simultaneous searches and deduplicates case-insensitively.
  const user = await User.findByIdAndUpdate(
    req.userId,
    [
      {
        $set: {
          searchHistory: {
            $slice: [
              {
                $concatArrays: [
                  [{ query: { $literal: query }, searchedAt: new Date() }],
                  {
                    $filter: {
                      input: { $ifNull: ["$searchHistory", []] },
                      as: "search",
                      cond: {
                        $ne: [
                          { $toLower: "$$search.query" },
                          { $literal: query.toLowerCase() },
                        ],
                      },
                    },
                  },
                ],
              },
              10,
            ],
          },
        },
      },
    ],
    { new: true, updatePipeline: true },
  );
  res.json(user.searchHistory);
});
router.delete("/me/searches", async (req, res) => {
  await User.updateOne({ _id: req.userId }, { $set: { searchHistory: [] } });
  res.sendStatus(204);
});
router.get("/search", async (req, res) => {
  const q =
    typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  if (q.length < 2) return res.json([]);
  const regex = new RegExp(escapeRegex(q), "i");
  res.json(
    await User.find({
      _id: { $ne: req.userId },
      $or: [{ name: regex }, { username: regex }],
    })
      .select("name username avatar")
      .limit(20),
  );
});
router.get("/me/friends", async (req, res) => {
  res.json(
    await Friendship.find({
      $or: [{ requester: req.userId }, { recipient: req.userId }],
    })
      .populate("requester recipient", "name username avatar")
      .sort({ createdAt: -1 }),
  );
});
router.post("/me/friends/:userId", async (req, res) => {
  const other = req.params.userId;
  if (other === req.userId)
    return res.status(400).json({ error: "Choose another student." });
  if (!(await User.exists({ _id: other })))
    return res.status(404).json({ error: "Student not found." });
  const pair = [req.userId, other].sort().join(":");
  const existing = await Friendship.findOne({ pair });
  if (existing)
    return res
      .status(409)
      .json({ error: "A friendship or request already exists." });
  const friendship = await Friendship.create({ pair, requester: req.userId, recipient: other });
  await notify([other], { kind: "friend_request", title: "New friend request", message: `${req.user.name} sent you a friend request.`, href: "/friends" });
  res.status(201).json(friendship);
});
router.put("/me/friends/:friendshipId", async (req, res) => {
  const friendship = await Friendship.findOneAndUpdate(
    { _id: req.params.friendshipId, recipient: req.userId, status: "pending" },
    { status: "accepted" },
    { new: true },
  );
  if (!friendship)
    return res.status(404).json({ error: "Incoming request not found." });
  await notify([friendship.requester], { kind: "friend_accepted", title: "Friend request accepted", message: `${req.user.name} accepted your friend request.`, href: "/friends" });
  res.json(friendship);
});
router.delete("/me/friends/:friendshipId", async (req, res) => {
  const result = await Friendship.findOneAndDelete({
    _id: req.params.friendshipId,
    $or: [{ requester: req.userId }, { recipient: req.userId }],
  });
  if (!result) return res.status(404).json({ error: "Friendship not found." });
  res.sendStatus(204);
});
module.exports = router;
