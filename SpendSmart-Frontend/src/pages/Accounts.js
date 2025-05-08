import React, { useEffect, useState, useMemo } from 'react';
import { SelectedAccountsProvider, useSelectedAccounts } from '../contexts/SelectedAccountsContext';
import { useTheme } from '@mui/material/styles';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  TablePagination,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  fetchTransactionsByAccount,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../api';

function AccountsContent() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const { selectedAccounts, toggleAccountSelection } = useSelectedAccounts();

  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({ name: '', type: '', balance: '' });
  const [accountFormMode, setAccountFormMode] = useState('add'); // 'add' or 'edit'
  const [accountFormError, setAccountFormError] = useState('');

  // Expenses state
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', date: '', category: '' });
  const [expenseFormMode, setExpenseFormMode] = useState('add'); // 'add' or 'edit'
  const [expenseFormError, setExpenseFormError] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Pagination for expenses
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Account types options
  const accountTypes = ['checking', 'savings', 'credit', 'cash', 'other'];

  // Expense categories options
  const expenseCategories = [
    'Income',
    'Food',
    'Transport',
    'Shopping',
    'Debt',
    'Fees',
    'Housing',
    'Entertainment',
    'Health',
    'Travel',
    'Personal',
    'Subscriptions',
    'Investments',
    'Other',
  ];

  // Load accounts on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadAccounts();
    }
  }, [isAuthenticated]);

  // Load expenses when selectedAccount changes
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      const allTransactions = [];
      selectedAccounts.forEach(account => {
        loadExpensesForAccount(account._id, allTransactions);
      });
    } else {
      setExpenses([]);
      setFilteredTransactions([]);
    }
  }, [selectedAccounts]);

  // Load accounts function
  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetchAccounts();
      setAccounts(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedAccount(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load accounts', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Load expenses for account
  const loadExpensesForAccount = async (accountId, allTransactions) => {
    setLoadingExpenses(true);
    try {
      const response = await fetchTransactionsByAccount(accountId);
      const transactions = response.data || [];
      allTransactions.push(...transactions);
      
      // Sort transactions by date in descending order
      const sortedTransactions = allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setExpenses(sortedTransactions);
      setFilteredTransactions(sortedTransactions);
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Submit expense form
  // Removed duplicate declaration of handleExpenseFormSubmit

  // Open add account dialog
  const handleAddAccount = () => {
    setAccountForm({ name: '', type: 'other', balance: '' });
    setAccountFormMode('add');
    setAccountFormError('');
    setAccountDialogOpen(true);
  };

  // Open edit account dialog
  const handleEditAccount = (account) => {
    setAccountForm({ name: account.name, type: account.type, balance: account.balance });
    setAccountFormMode('edit');
    setAccountFormError('');
    setAccountDialogOpen(true);
  };

  // Handle account form change
  const handleAccountFormChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit account form
  const handleAccountFormSubmit = async () => {
    const { name, type, balance } = accountForm;
    if (!name || !type) {
      setAccountFormError('Name and type are required');
      return;
    }
    try {
      if (accountFormMode === 'add') {
        await createAccount({ name, type, balance: parseFloat(balance) || 0 });
      } else if (accountFormMode === 'edit' && selectedAccount) {
        await updateAccount(selectedAccount._id, { name, type, balance: parseFloat(balance) || 0 });
      }
      setAccountDialogOpen(false);
      await loadAccounts();
    } catch (error) {
      setAccountFormError('Failed to save account');
      console.error(error);
    }
  };

  // Delete account
  const handleDeleteAccount = async (account) => {
    if (!window.confirm(`Are you sure you want to delete account "${account.name}"? This will also delete related expenses.`)) {
      return;
    }
    try {
      await deleteAccount(account._id);
      if (selectedAccount && selectedAccount._id === account._id) {
        setSelectedAccount(null);
      }
      await loadAccounts();
    } catch (error) {
      console.error('Failed to delete account', error);
    }
  };

  // Open add expense dialog
  const handleAddExpense = () => {
    if (selectedAccounts.length === 0) {
      alert('Please select an account first');
      return;
    }
    setExpenseForm({ 
      description: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      category: 'Other',
      accountId: selectedAccounts[0]._id // Default to first selected account
    });
    setExpenseFormMode('add');
    setExpenseFormError('');
    setExpenseDialogOpen(true);
  };

  // Open edit expense dialog
  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      description: expense.description,
      amount: expense.amount,
      date: expense.date ? expense.date.split('T')[0] : '',
      category: expense.category,
      accountId: expense.accountId,
    });
    setExpenseFormMode('edit');
    setExpenseFormError('');
    setExpenseDialogOpen(true);
  };

  // Handle expense form change
  const handleExpenseFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit expense form
  const handleExpenseFormSubmit = async () => {
    const { description, amount, date, category, accountId } = expenseForm;
    if (!description || !amount || !date || !category || !accountId) {
      setExpenseFormError('All fields are required');
      return;
    }
    try {
      if (expenseFormMode === 'add') {
        await createTransaction(accountId, { description, amount: parseFloat(amount), date, category });
      } else if (expenseFormMode === 'edit' && selectedExpense) {
        await updateTransaction(selectedExpense._id, { description, amount: parseFloat(amount), date, category });
      }
      setExpenseDialogOpen(false);
      await loadExpensesForAccount(accountId, []);
    } catch (error) {
      setExpenseFormError('Failed to save expense');
      console.error(error);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Are you sure you want to delete transaction "${expense.description}"?`)) {
      return;
    }
    try {
      await deleteTransaction(expense._id);
      // Reload transactions for all selected accounts
      const allTransactions = [];
      for (const account of selectedAccounts) {
        await loadExpensesForAccount(account._id, allTransactions);
      }
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter transactions
  const [searchTerm, setSearchTerm] = useState('');
  const filteredAndSearchedTransactions = useMemo(() => {
    return filteredTransactions.filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredTransactions, searchTerm]);

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 2 }}>
      {/* Accounts list */}
      <Box sx={{ width: 400 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Accounts
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddAccount}
          >
            Add
          </Button>
        </Box>
        {loadingAccounts ? (
          <CircularProgress />
        ) : (
          <List>
            {accounts.map((account) => (
              <ListItem
                key={account._id}
                disablePadding
                secondaryAction={
                  <>
                    <Tooltip title="Edit Account">
                      <IconButton edge="end" onClick={() => handleEditAccount(account)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Account">
                      <IconButton edge="end" onClick={() => handleDeleteAccount(account)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                }
              >
                <ListItemButton 
                  onClick={() => toggleAccountSelection(account)}
                  sx={{ 
                    backgroundColor: selectedAccounts.some(a => a._id === account._id) 
                      ? 'action.selected' 
                      : 'transparent' 
                  }}
                >
                  <IconButton
                    edge="start"
                    sx={{ mr: 2 }}
                  >
                    {selectedAccounts.some(a => a._id === account._id) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                  </IconButton>
                  <ListItemText
                    primary={account.name}
                    secondary={`Type: ${account.type}, Balance: ₹${account.balance.toFixed(2)}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Expenses list */}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Transactions {selectedAccount ? `for "${selectedAccount.name}"` : ''}
            </Typography>
            {selectedAccount && (
              <Typography variant="body2" color="text.secondary">
                Total Balance: ₹{selectedAccount.balance.toFixed(2)}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddExpense}
            disabled={!selectedAccount}
          >
            Add Transaction
          </Button>
        </Box>
        {loadingExpenses ? (
          <CircularProgress />
        ) : selectedAccount ? (
          <>
            <TableContainer component={Paper}>
              <Table aria-label="expenses table">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No transactions yet. Add your first transaction!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((expense) => (
                      <TableRow 
                        key={expense._id} 
                        hover 
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          transition: 'background-color 0.2s',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {expense.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={expense.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={expense.amount > 0 ? 'success.main' : 'error.main'}
                          >
                            ₹{Math.abs(expense.amount).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(expense.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Tooltip title="Edit Transaction">
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => handleEditExpense(expense)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Transaction">
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeleteExpense(expense)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={expenses.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </TableContainer>
          </>
        ) : (
          <Typography variant="body1">Select an account to view expenses.</Typography>
        )}

        {/* Account Dialog */}
        <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)}>
          <DialogTitle>{accountFormMode === 'add' ? 'Add Account' : 'Edit Account'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              name="name"
              fullWidth
              value={accountForm.name}
              onChange={handleAccountFormChange}
            />
            <TextField
              margin="dense"
              label="Type"
              name="type"
              select
              fullWidth
              SelectProps={{ native: true }}
              value={accountForm.type}
              onChange={handleAccountFormChange}
            >
              {accountTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </TextField>
            <TextField
              margin="dense"
              label="Balance"
              name="balance"
              type="number"
              fullWidth
              value={accountForm.balance}
              onChange={handleAccountFormChange}
            />
            {accountFormError && <Typography color="error">{accountFormError}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAccountFormSubmit} variant="contained">
              {accountFormMode === 'add' ? 'Add' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Expense Dialog */}
        <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)}>
          <DialogTitle>{expenseFormMode === 'add' ? 'Add Expense' : 'Edit Expense'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Description"
              name="description"
              fullWidth
              value={expenseForm.description}
              onChange={handleExpenseFormChange}
            />
            <TextField
              margin="dense"
              label="Amount"
              name="amount"
              type="number"
              fullWidth
              value={expenseForm.amount}
              onChange={handleExpenseFormChange}
            />
            <TextField
              margin="dense"
              label="Date"
              name="date"
              type="date"
              fullWidth
              value={expenseForm.date}
              onChange={handleExpenseFormChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="Category"
              name="category"
              select
              fullWidth
              SelectProps={{ native: true }}
              value={expenseForm.category}
              onChange={handleExpenseFormChange}
            >
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </TextField>
            {expenseFormError && <Typography color="error">{expenseFormError}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleExpenseFormSubmit} variant="contained">
              {expenseFormMode === 'add' ? 'Add' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

function Accounts() {
  return (
    <SelectedAccountsProvider>
      <AccountsContent />
    </SelectedAccountsProvider>
  );
}

export default Accounts;
