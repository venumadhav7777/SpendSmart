const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const expenseRoutes = require('./routes/expenseRoutes');
const accountRoutes = require('./routes/accountRoutes');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/expenses', expenseRoutes);

const PORT = process.env.PORT || 3005;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Expense service running on port ${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to connect to MongoDB', err);
    });
