// src/controllers/budgetController.js
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction'); // if you query transactions directly
const { sendMail } = require('../utils/emailService');

// Create a new budget
exports.createBudget = async (req, res) => {
    try {
        const { name, category, limit, period } = req.body;
        const { id: authUser } = req.user;

        const budget = await Budget.create({
            authUser,
            name,
            category,
            limit,
            period,
        });

        await checkBudgetAndNotify(budget, req.user.id, req.user.email);

        res.status(201).json(budget);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all budgets for the authenticated user
exports.getBudgets = async (req, res) => {
    try {
        const { id: authUser } = req.user;
        const budgets = await Budget.find({ authUser });
        res.json(budgets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update a budget
exports.updateBudget = async (req, res) => {
    try {
        const { id: authUser } = req.user;
        const { budgetId } = req.params;
        const updates = req.body;

        const budget = await Budget.findOneAndUpdate(
            { _id: budgetId, authUser },
            updates,
            { new: true }
        );

        if (!budget) return res.status(404).json({ message: 'Budget not found' });

        await checkBudgetAndNotify(budget, req.user.id, req.user.email);

        res.status(200).json(budget);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a budget
exports.deleteBudget = async (req, res) => {
    try {
        const { id: authUser } = req.user;
        const { budgetId } = req.params;

        const result = await Budget.deleteOne({ _id: budgetId, authUser });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.json({ message: 'Budget deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/budgets/summary
exports.getBudgetSummary = async (req, res) => {
    try {
        const authUser = new mongoose.Types.ObjectId(req.user.id);
        const budgets = await Budget.find({ authUser });

        const summaries = await Promise.all(budgets.map(async b => {
            // determine start of period
            const now = new Date();
            let startDate;
            if (b.period === 'monthly') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else {
                const dow = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dow);
            }

            console.log('Checking budget:', b.name, 'for user:', authUser, 'starting from:', startDate)

            // aggregate spent
            const result = await Transaction.aggregate([
                {
                    $match: {
                        user: authUser,
                        category: b.category,
                        date: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            console.log('Aggregation result:', result);

            const spent = result.length ? result[0].total : 0;
            const remaining = b.limit - spent;
            const percentUsed = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;

            console.log('Total spent:', spent, 'Remaining:', remaining, 'Percent used:', percentUsed, '%');
            return {
                budgetId: b._id,
                name: b.name,
                limit: b.limit,
                period: b.period,
                spent,
                remaining,
                percentUsed
            };
        }));

        res.json(summaries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

async function checkBudgetAndNotify(budget, authUser, userEmail) {
    // find total spent this period (reuse summary logic)
    const now = new Date();
    let startDate = budget.period === 'monthly'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.setDate(now.getDate() - now.getDay()));

    console.log('Checking budget:', budget.name, 'for user:', authUser, 'starting from:', startDate);

    const agg = await Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(authUser), category: budget.category, date: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log('Aggregation result:', agg);

    const spent = agg.length ? agg[0].total : 0;

    console.log('Total spent:', spent);

    if (spent > budget.limit) {
        await sendMail({
            to: userEmail,
            subject: `Budget Exceeded: ${budget.name}`,
            text: `You have spent \$${spent} on "${budget.name}", which exceeds your limit of \$${budget.limit}.`,
            html: `<p>You have spent <strong>$${spent}</strong> on "<em>${budget.name}</em>", which exceeds your limit of <strong>$${budget.limit}</strong>.</p>`
        });
    }
}