// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());

// Example simple route
app.get('/health', (_req, res) => {
  res.json({ message: 'SpendSmart Microservice Running!' });
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(`Auth Service: MongoDB Connected Successfully`)
    app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
  })
  .catch((err) => console.error('Auth Service: MongoDB connection error:', err));
