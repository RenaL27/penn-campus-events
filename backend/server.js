const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// connect to mongodb
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB error:", err));

// routes
app.use('/auth', require('./src/routes/auth'));
app.use('/events', require('./src/routes/events'));

app.listen(8080, () => console.log("Server running on port 8080"));
