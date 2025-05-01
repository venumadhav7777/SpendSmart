// src/controllers/savingsController.js
const SavingsGoal = require('../models/SavingsGoal');
const { sendMail } = require('../utils/emailService');

// Create a new savings goal
exports.createGoal = async (req, res) => {
    try {
        const { name, target, deadline } = req.body;
        const { id: authUser } = req.user;

        const goal = await SavingsGoal.create({
            authUser,
            name,
            target,
            deadline,
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

// Update a savings goal (e.g., contribute to saved)
exports.updateGoal = async (req, res) => {
    try {
        const { id: authUser } = req.user;
        const { goalId } = req.params;
        const updates = req.body;

        const goal = await SavingsGoal.findOneAndUpdate(
            { _id: goalId, authUser },
            updates,
            { new: true }
        );

        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        if (goal.saved >= goal.target) {
            await sendMail({
              to: req.user.email,
              subject: `Goal Reached: ${goal.name}`,
              text: `Congratulations! You have reached your savings goal "${goal.name}".`,
              html: `<p>Congratulations! You have reached your savings goal "<strong>${goal.name}</strong>".</p>`
            });
          }

        res.status(200).json(goal);
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


// GET /api/savings/progress
exports.getSavingsProgress = async (req, res) => {
    try {
        const authUser = req.user.id;
        const goals = await SavingsGoal.find({ authUser });

        const progress = goals.map(g => ({
            goalId: g._id,
            name: g.name,
            target: g.target,
            saved: g.saved,
            percentComplete: g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0
        }));

        res.json(progress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};