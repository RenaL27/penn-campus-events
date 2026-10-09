const router = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  if (![name, username, email, password].every(value => typeof value === 'string') ||
      !name.trim() || name.length > 100 || !/^[a-zA-Z0-9_.-]{3,40}$/.test(username) ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 10 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Enter a name, valid email, username (3–40 letters, numbers, dots, dashes or underscores), and password of at least 10 characters (maximum 72 UTF-8 bytes).' });
  }
  const user = await User.create({ name: name.trim(), username, email: email.trim().toLowerCase(), password });
  res.status(201).json({ message: 'User registered successfully', userId: user._id });
});
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 100 || password.length > 1000) return res.status(400).json({ error: 'Incorrect username or password.' });
  const user = await User.findOne({ username }).select('+password +passwordHashVersion');
  // Dummy hash keeps unknown usernames on the same expensive verification path.
  const fallback = '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
  const valid = await bcrypt.compare(password, user?.passwordHashVersion === 1 ? user.password : fallback);
  if (!user || user.passwordHashVersion !== 1 || !valid) return res.status(400).json({ error: 'Incorrect username or password.' });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d', issuer: 'penn-campus-events', audience: 'penn-campus-events-web' });
  res.json({ message: 'Login successful', token, userId: user._id });
});
module.exports = router;
