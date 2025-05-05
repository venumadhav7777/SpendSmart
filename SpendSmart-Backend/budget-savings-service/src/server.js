// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const { loadCategoryMap } = require('./utils/categoryMap');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(bodyParser.json());

// Example simple route
app.get('/health', (_req, res) => {
  res.json({ message: 'SpendSmart Microservice Running!' });
});

const budgetRoutes = require('./routes/budgetRoutes');
app.use('/api/budgets', budgetRoutes);

const savingRoutes = require('./routes/savingRoutes');
app.use('/api/savings', savingRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Budget-Savings Service: MongoDB Connected Successfully');
    await loadCategoryMap();          // build PFC lookup first :contentReference[oaicite:6]{index=6}
    app.listen(PORT, () => console.log(`Budget-Savings Service running on port ${PORT}`));
  })
  .catch(err => console.error('Budget Savings-Service: MongoDB connection error:', err));

