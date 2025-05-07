// src/controllers/budgetController.js
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction'); // if you query transactions directly
const { sendMail } = require('../utils/emailService');
const { syncAndCategorize } = require('../utils/budgetUtils');

// Create a new budget
exports.createBudget = async (req, res) => {
    try {
        const { name, category, limit, period } = req.body;
        const { id: authUser, email: ownerMail } = req.user;

        const budget = await Budget.create({
            authUser,
            name,
            category,
            limit,
            period,
            ownerMail
        });

        const checkedBudget = await checkBudgetAndNotify(budget, req.user.id, ownerMail);

        res.status(201).json(checkedBudget);
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
        const { id: authUser, email: ownerMail } = req.user;
        const { budgetId } = req.params;
        const updates = req.body;

        const budget = await Budget.findOneAndUpdate(
            { _id: budgetId, authUser },
            updates,
            { new: true }
        );

        if (!budget) return res.status(404).json({ message: 'Budget not found' });

        const checkedBudget = await checkBudgetAndNotify(budget, req.user.id, ownerMail);

        res.status(200).json(checkedBudget);
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

/**
 * GET /api/budgets/summary
 * 1. Extract the user’s Bearer token
 * 2. Call refresh & sync on the Transactions Service
 * 3. Aggregate each budget’s spent vs. limit
 */
exports.getBudgetSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        // 1️⃣ Extract the Bearer token from the incoming request
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Missing or invalid authorization header' });
        }
        const token = authHeader.split(' ')[1];

        // 2️⃣ Remove the refresh + sync before calculating budgets
        // await syncAndCategorize(token, userId);

        // 3️⃣ Fetch all budgets for this user
        const authUser = new mongoose.Types.ObjectId(req.user.id);
        const budgets = await Budget.find({ authUser });

        // 4️⃣ Build summaries
        const summaries = await Promise.all(budgets.map(async b => {
            // Determine period start date
            const now = new Date();
            let startDate;
            if (b.period === 'monthly') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            } else {
                const dow = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dow);
            }

            console.log('Calculating budget:', b.name, 'starting from:', startDate);

            // Aggregate total spent in this budget’s category since startDate
            const agg = await Transaction.aggregate([
                {
                    $match: {
                        user: authUser,
                        budgetCategory: b.category,
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


            console.log('Aggregation result:', agg);

            const spent = agg.length ? agg[0].total : 0;
            const remaining = b.limit - spent;
            const percentUsed = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;

            console.log('Budget:', b.name, 'spent:', spent, 'remaining:', remaining, 'percent:', percentUsed);

            await Budget.updateOne({ _id: b._id }, { $set: { spent, remaining, percentUsed } });

            if (percentUsed > 100) {
              // Over the limit
              await sendMail({
                to: req.user.email,
                subject: `Budget Exceeded: ${b.name}`,
                text: `You have spent ₹${spent} on "${b.name}", which exceeds your limit of ₹${b.limit} (${percentUsed}%).`,
                html: `<p>You have spent <strong>₹${spent}</strong> on "<em>${b.name}</em>", which exceeds your limit of <strong>₹${b.limit}</strong> (${percentUsed}%).</p>`
              });
              console.log(`Budget exceeded 100%, sending email to:`, req.user.email);
            
            } else if (percentUsed >= 90) {
              // 90% warning
              await sendMail({
                to: req.user.email,
                subject: `Budget Warning: ${b.name} at 90%`,
                text: `You have used ${percentUsed}% of your ₹${b.limit} budget for "${b.name}". (₹${spent} spent)`,
                html: `<p>You have used <strong>${percentUsed}%</strong> of your <strong>₹${b.limit}</strong> budget for "<em>${b.name}</em>". (<strong>₹${spent}</strong> spent)</p>`
              });
              console.log(`Budget reached 90%, sending warning to:`, req.user.email);
            
            } else if (percentUsed >= 75) {
              // 75% warning
              await sendMail({
                to: req.user.email,
                subject: `Budget Warning: ${b.name} at 75%`,
                text: `You have used ${percentUsed}% of your ₹${b.limit} budget for "${b.name}". (₹${spent} spent)`,
                html: `<p>You have used <strong>${percentUsed}%</strong> of your <strong>₹${b.limit}</strong> budget for "<em>${b.name}</em>". (<strong>₹${spent}</strong> spent)</p>`
              });
              console.log(`Budget reached 75%, sending warning to:`, req.user.email);
            
            } else if (percentUsed >= 50) {
              // 50% warning
              await sendMail({
                to: req.user.email,
                subject: `Budget Warning: ${b.name} at 50%`,
                text: `You have used ${percentUsed}% of your ₹${b.limit} budget for "${b.name}". (₹${spent} spent)`,
                html: `<p>You have used <strong>${percentUsed}%</strong> of your <strong>₹${b.limit}</strong> budget for "<em>${b.name}</em>". (<strong>₹${spent}</strong> spent)</p>`
              });
              console.log(`Budget reached 50%, sending warning to:`, req.user.email);
            }
            return {
                budgetId: b._id,
                name: b.name,
                category: b.category,
                limit: b.limit,
                period: b.period,
                spent,
                remaining,
                percentUsed
            };
        }));

        // 5️⃣ Return the summaries
        res.status(200).json(summaries);

    } catch (err) {
        console.error('getBudgetSummary error:', err);
        res.status(500).json({ message: err.message });
    }
};

const checkBudgetAndNotify = async (budget, user, userEmail) => {
    const authUser = new mongoose.Types.ObjectId(user);
    // find total spent this period (reuse summary logic)
    const now = new Date();
    let startDate;
    if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else {
        const dow = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dow);
    }

    console.log('Calculating budget:', budget.name, 'starting from:', startDate);

    // Aggregate total spent in this budget’s category since startDate
    const agg = await Transaction.aggregate([
        {
            $match: {
                user: authUser,
                budgetCategory: budget.category,
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


    console.log('Aggregation result:', agg);

    const spent = agg.length ? agg[0].total : 0;
    const remaining = budget.limit - spent;
    const percentUsed = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;

    console.log('Budget:', budget.name, 'spent:', spent, 'remaining:', remaining, 'percent:', percentUsed);

    await Budget.updateOne({ _id: budget._id }, { $set: { spent, remaining, percentUsed } });

    if (percentUsed > 100) {
      // Over the limit
      await sendMail({
        to: userEmail,
        subject: `Budget Exceeded: ${budget.name}`,
        text: `You have spent ₹${spent} on "${budget.name}", which exceeds your limit of ₹${budget.limit} (${percentUsed}%).`,
        html: `<p>You have spent <strong>₹${spent}</strong> on "<em>${budget.name}</em>", which exceeds your limit of <strong>₹${budget.limit}</strong> (${percentUsed}%).</p>`
      });
      console.log(`Budget exceeded 100%, sending email to:`, userEmail);
    
    } else if (percentUsed >= 90) {
      // 90% warning
      await sendMail({
        to: userEmail,
        subject: `Budget Warning: ${budget.name} at 90%`,
        text: `You have used ${percentUsed}% of your ₹${budget.limit} budget for "${budget.name}". (₹${spent} spent)`,
        html: `<p>You have used <strong>${percentUsed}%</strong> of your <strong>₹${budget.limit}</strong> budget for "<em>${budget.name}</em>". (<strong>₹${spent}</strong> spent)</p>`
      });
      console.log(`Budget reached 90%, sending warning to:`, userEmail);
    
    } else if (percentUsed >= 75) {
      // 75% warning
      await sendMail({
        to: userEmail,
        subject: `Budget Warning: ${budget.name} at 75%`,
        text: `You have used ${percentUsed}% of your ₹${budget.limit} budget for "${budget.name}". (₹${spent} spent)`,
        html: `<p>You have used <strong>${percentUsed}%</strong> of your <strong>₹${budget.limit}</strong> budget for "<em>${budget.name}</em>". (<strong>₹${spent}</strong> spent)</p>`
      });
      console.log(`Budget reached 75%, sending warning to:`, userEmail);
    
    } else if (percentUsed >= 50) {
      // 50% warning
      await sendMail({
        to: userEmail,
        subject: `Budget Warning: ${budget.name} at 50%`,
        text: `You have used ${percentUsed}% of your ₹${budget.limit} budget for "${budget.name}". (₹${spent} spent)`,
        html: `<p>You have used <strong>${percentUsed}%</strong> of your <strong>₹${budget.limit}</strong> budget for "<em>${budget.name}</em>". (<strong>₹${spent}</strong> spent)</p>`
      });
      console.log(`Budget reached 50%, sending warning to:`, userEmail);
    }

    const updatedBudget = await Budget.findOne({ _id: budget._id });

    console.log('Budget updated:', updatedBudget);
    return updatedBudget;
}
