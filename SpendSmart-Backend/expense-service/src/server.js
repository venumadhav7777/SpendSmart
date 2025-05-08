const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const expenseRoutes = require('./routes/expenseRoutes');
const accountRoutes = require('./routes/accountRoutes');
const { protect } = require('./middlewares/authMiddleware');

dotenv.config();

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

// Routes
app.use('/api/accounts', protect, accountRoutes);
app.use('/api/expenses', protect, expenseRoutes);

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`Expense service running on port ${PORT}`);
});
