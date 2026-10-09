require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = mongoose.connection.collection('users');
    const cursor = users.find({ passwordHashVersion: { $ne: 1 } }, { projection: { password: 1 } });
    let migrated = 0;
    for await (const user of cursor) {
      if (typeof user.password !== 'string') throw new Error('Account has no valid password; migration stopped.');
      const password = await bcrypt.hash(user.password, 12);
      const result = await users.updateOne({ _id: user._id, password: user.password, passwordHashVersion: { $ne: 1 } }, { $set: { password, passwordHashVersion: 1 } });
      migrated += result.modifiedCount;
    }
    console.log(`Migrated ${migrated} account passwords. No credentials were printed.`);
  } catch (error) { console.error('Password migration failed:', error.name); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();
