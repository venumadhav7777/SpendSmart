const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

// Get expenses by account ID
exports.getTransactionsByAccountId = async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.accountId;

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(403).json({ message: 'Not authorized to view expenses for this account' });
    }

    // Find expenses for this account
    const expenses = await Transaction.find({ accountId });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

// Create a new expense associated with an account
exports.createTransaction = async (req, res) => {
  try {
    const { accountId, description, amount, date, category } = req.body;
    const userId = req.user.id;

    // Verify the account belongs to the user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found or not authorized' });
    }

    const expense = new Transaction({
      accountId,
      description,
      amount,
      date,
      category,
    });

    const savedExpense = await expense.save();

    account.balance -= amount;
    account.noOfExpenses += 1;
    await account.save();

    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create transaction', error: error.message });
  }
};

// Get all expenses for accounts belonging to the authenticated user, optionally filtered by accountId
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.query;

    // Find accounts for user
    const accounts = await Account.find({ userId }).select('_id');
    const accountIds = accounts.map(acc => acc._id.toString());

    let filterAccountIds = accountIds;
    if (accountId) {
      if (!accountIds.includes(accountId)) {
        return res.status(403).json({ message: 'Not authorized to view expenses for this account' });
      }
      filterAccountIds = [accountId];
    }

    // Find expenses for these accounts
    const expenses = await Transaction.find({ accountId: { $in: filterAccountIds } });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

// Get a single expense by id, only if it belongs to an account of the user
exports.getTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    const expense = await Transaction.findById(expenseId);
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
exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;
    const { description, amount, date, category } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Verify transaction account belongs to user
    const account = await Account.findOne({ _id: transaction.accountId, userId });
    if (!account) {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }

    // Adjust account balance if amount changed
    const amountDifference = amount - transaction.amount;
    account.balance -= amountDifference;
    await account.save();

    transaction.description = description;
    transaction.amount = amount;
    transaction.date = date;
    transaction.category = category;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update transaction', error: error.message });
  }
};

// Get transactions for multiple accounts
exports.getTransactionsByAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountIds } = req.body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty account IDs' });
    }

    // Verify all accounts belong to the user
    const accounts = await Account.find({ _id: { $in: accountIds }, userId });
    if (accounts.length !== accountIds.length) {
      return res.status(403).json({ message: 'Not authorized to view transactions for some accounts' });
    }

    // Find transactions for the specified accounts
    const transactions = await Transaction.find({
      accountId: { $in: accountIds }
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Verify transaction account belongs to user
    const account = await Account.findOne({ _id: transaction.accountId, userId });
    if (!account) {
      return res.status(403).json({ message: 'Not authorized to delete this transaction' });
    }

    // Adjust account balance and number of transactions
    account.balance += transaction.amount;
    account.noOfExpenses -= 1;
    await account.save();

    await Transaction.findByIdAndDelete(transactionId);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
  }
};

// Update an expense by id, only if it belongs to an account of the user
exports.updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;
    const { description, amount, date, category, accountId } = req.body;

    const expense = await Transaction.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify expense account belongs to user
    const account = await Account.findOne({ _id: expense.accountId, userId });
    if (!account) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    // Store original amount before updating
    const originalAmount = expense.amount;

    // If accountId is changed, verify new account belongs to user
    if (accountId && accountId !== expense.accountId.toString()) {
      const newAccount = await Account.findOne({ _id: accountId, userId });
      if (!newAccount) {
        return res.status(403).json({ message: 'Not authorized to assign expense to this account' });
      }
      
      // Update old account
      account.balance += originalAmount;
      account.noOfExpenses -= 1;
      await account.save();

      // Update new account
      newAccount.balance -= amount || originalAmount;
      newAccount.noOfExpenses += 1;
      await newAccount.save();

      expense.accountId = accountId;
    } else if (amount && amount !== originalAmount) {
      // If only amount changed, update current account balance
      account.balance = account.balance + originalAmount - amount;
      await account.save();
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

    const expense = await Transaction.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify expense account belongs to user
    const account = await Account.findOne({ _id: expense.accountId, userId });
    if (!account) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await expense.remove();
    account.balance += expense.amount;
    account.noOfExpenses -= 1;
    await account.save();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete expense', error: error.message });
  }
};
