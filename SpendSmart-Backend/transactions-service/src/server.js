const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());

app.get('/health', (_req, res) => {
  res.json({ message: 'Transactions Microservice Running!' });
});

const transactionRoutes = require('./routes/transactionRoutes');
app.use('/api/transactions', transactionRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Transactions Service: MongoDB Connected Successfully');
    app.listen(PORT, () =>
      console.log(`Transactions Service running on port ${PORT}`)
    );
  })
  .catch((err) =>
    console.error('Transactions Service: MongoDB connection error:', err)
  );
