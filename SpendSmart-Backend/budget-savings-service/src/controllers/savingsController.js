// src/controllers/savingsController.js
const SavingsGoal = require('../models/SavingsGoal');
const { sendMail } = require('../utils/emailService');

/**
 * Create a new goal
 */
exports.createGoal = async (req, res) => {
    try {
        const { name, target, deadline } = req.body;
        const { id: authUser, email } = req.user;

        const goal = await SavingsGoal.create({
            authUser,
            name,
            target,
            deadline,
            ownerMail: email
        });

        res.status(201).json(goal);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all savings goals for the authenticated user
exports.getGoals = async (req, res) => {
    try {
        const { id: authUser } = req.user;
        const goals = await SavingsGoal.find({ authUser });
        res.json(goals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Delete a savings goal
exports.deleteGoal = async (req, res) => {
    try {
        const { id: authUser } = req.user;
        const { goalId } = req.params;

        const result = await SavingsGoal.deleteOne({ _id: goalId, authUser });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Manual contribution: also records a 'manual' contribution subdoc
 */
exports.updateGoal = async (req, res) => {
    try {
        const { id: authUser, email } = req.user;
        const { goalId } = req.params;
        const { saved: newSavedValue, deadline } = req.body;

        // Find and update the goal
        const goal = await SavingsGoal.findOne({ _id: goalId, authUser });
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        // Update deadline if provided
        if (deadline) {
            goal.deadline = new Date(deadline);
        }

        // Update saved amount if provided
        if (newSavedValue !== undefined) {
            const contributionAmount = newSavedValue - goal.saved;
            if (contributionAmount > 0) {
                // 1) update the total saved
                goal.saved = newSavedValue;

                // 2) record the contribution
                goal.contributions.push({
                    amount: contributionAmount,
                    type: 'manual'
                });
            }
        }

        await goal.save();

        // 3) send congrats if reached and not already notified
        if (goal.saved >= goal.target && !goal.goalReachedNotified) {
            console.log('Goal reached!');
            console.log('Sending email...');
            await sendMail({
                to: email,
                subject: `Goal Reached: ${goal.name}`,
                text: `🎉 You've reached your savings goal "${goal.name}"!`,
                html: `<h1>🎉 You've reached your savings goal "${goal.name}"!</h1>`
            });
            
            // Mark as notified
            goal.goalReachedNotified = true;
            await goal.save();
        }

        res.json(goal);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Auto-allocation via 50/30/20: records 'auto' contributions
 */
exports.allocateSavings = async (req, res) => {
    try {
        const { amount } = req.body;
        const authUser = req.user.id;

        const savingsPortion = amount * 0.2;
        const goals = await SavingsGoal.find({ authUser });
        if (!goals.length) {
            return res.status(400).json({ message: 'No goals to allocate to.' });
        }

        const totalRemaining = goals.reduce((sum, g) => sum + (g.target - g.saved), 0);
        if (totalRemaining === 0) {
            return res.status(400).json({ message: 'All goals complete.' });
        }

        const results = [];
        for (let g of goals) {
            const share = Math.round(((g.target - g.saved) / totalRemaining) * savingsPortion);
            if (share <= 0) continue;

            // update the saved total
            g.saved = Math.min(g.saved + share, g.target);

            // record the auto contribution
            g.contributions.push({
                amount: share,
                type: 'auto'
            });

            await g.save();
            results.push({ goalId: g._id, name: g.name, newSaved: g.saved });
        }

        res.json({ allocated: savingsPortion, details: results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Fetch progress with full history if needed
 */
exports.getSavingsProgress = async (req, res) => {
    try {
        const authUser = req.user.id;
        const goals = await SavingsGoal.find({ authUser });

        const progress = goals.map(g => {
            const percent = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
            const daysLeft = g.deadline
                ? Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                : null;
            return {
                goalId: g._id,
                name: g.name,
                target: g.target,
                saved: g.saved,
                percentComplete: percent,
                daysLeft,
                contributions: g.contributions   // full subdocument array :contentReference[oaicite:3]{index=3}
            };
        });

        res.json(progress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
