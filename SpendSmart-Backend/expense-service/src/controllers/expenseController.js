const Expense = require('../models/Expense');
const Account = require('../models/Account');

// Create a new expense associated with an account
exports.createExpense = async (req, res) => {
  try {
    const { accountId, description, amount, date, category } = req.body;
    const userId = req.user.id;

    // Verify the account belongs to the user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found or not authorized' });
    }

    const expense = new Expense({
      accountId,
      description,
      amount,
      date,
      category,
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create expense', error: error.message });
  }
};

// Get all expenses for accounts belonging to the authenticated user
exports.getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find accounts for user
    const accounts = await Account.find({ userId }).select('_id');
    const accountIds = accounts.map(acc => acc._id);

    // Find expenses for these accounts
    const expenses = await Expense.find({ accountId: { $in: accountIds } });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
};

// Get a single expense by id, only if it belongs to an account of the user
exports.getExpenseById = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify expense account belongs to user
    const account = await Account.findOne({ _id: expense.accountId, userId });
    if (!account) {
      return res.status(403).json({ message: 'Not authorized to view this expense' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch expense', error: error.message });
  }
};

// Update an expense by id, only if it belongs to an account of the user
exports.updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;
    const { description, amount, date, category, accountId } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify expense account belongs to user
    const account = await Account.findOne({ _id: expense.accountId, userId });
    if (!account) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    // If accountId is changed, verify new account belongs to user
    if (accountId && accountId !== expense.accountId.toString()) {
      const newAccount = await Account.findOne({ _id: accountId, userId });
      if (!newAccount) {
        return res.status(403).json({ message: 'Not authorized to assign expense to this account' });
      }
      expense.accountId = accountId;
    }

    expense.description = description || expense.description;
    expense.amount = amount || expense.amount;
    expense.date = date || expense.date;
    expense.category = category || expense.category;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update expense', error: error.message });
  }
};

// Delete an expense by id, only if it belongs to an account of the user
exports.deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify expense account belongs to user
    const account = await Account.findOne({ _id: expense.accountId, userId });
    if (!account) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await expense.remove();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete expense', error: error.message });
  }
};
