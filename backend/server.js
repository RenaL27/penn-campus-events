require('dotenv').config();
const mongoose = require('mongoose');
process.env.CLIENT_ORIGIN ||= process.env.RENDER_EXTERNAL_URL;
const app = require('./src/app');
async function start() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('Set MONGO_URI and JWT_SECRET.');
  if (process.env.NODE_ENV === 'production' && ((process.env.JWT_SECRET.length < 32 || /replace|your_random|your_secret/i.test(process.env.JWT_SECRET)) || !process.env.CLIENT_ORIGIN?.startsWith('https://'))) throw new Error('Production requires a random JWT_SECRET of at least 32 characters and HTTPS CLIENT_ORIGIN.');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  if (await mongoose.connection.collection('users').countDocuments({ passwordHashVersion: { $ne: 1 } })) throw new Error('Run npm run migrate:passwords before starting: legacy passwords remain.');
  const server = app.listen(process.env.PORT || 8080, '0.0.0.0', () => console.log(`Server running on port ${process.env.PORT || 8080}`));
  const stop = () => { server.close(async () => { await mongoose.disconnect(); process.exit(0); }); setTimeout(() => process.exit(1), 10000).unref(); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
start().catch(async err => { console.error('Startup failed:', err.name, /legacy passwords|Production requires|Set MONGO/.test(err.message) ? err.message : 'Check database credentials and network access.'); await mongoose.disconnect(); process.exitCode = 1; });
