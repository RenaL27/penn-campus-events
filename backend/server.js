require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
async function start() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('Set MONGO_URI and JWT_SECRET in backend/.env.');
  await mongoose.connect(process.env.MONGO_URI);
  app.listen(process.env.PORT || 8080, () => console.log(`Server running on port ${process.env.PORT || 8080}`));
}
start().catch(err => { console.error(err.message); process.exitCode = 1; });
