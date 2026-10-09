const jwt = require("jsonwebtoken");
const User = require("../models/user");
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      return res.status(401).json({ error: "Please log in to continue." });
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ["HS256"], issuer: "penn-campus-events", audience: "penn-campus-events-web" });
    const user = await User.findById(decoded.userId).select("-password");
    if (!user)
      return res
        .status(401)
        .json({ error: "Account not found. Please log in again." });
    req.userId = String(user._id);
    req.user = user;
    next();
  } catch (error) {
    if (
      ["JsonWebTokenError", "TokenExpiredError", "CastError"].includes(
        error.name,
      )
    ) {
      return res
        .status(401)
        .json({ error: "Your session has expired. Please log in again." });
    }
    next(error);
  }
}
module.exports = authenticate;
module.exports.optional = (req, res, next) =>
  req.headers.authorization ? authenticate(req, res, next) : next();
