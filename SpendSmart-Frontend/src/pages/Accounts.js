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
  Card,
  CardContent,
  Grid,
  MenuItem,
  InputAdornment,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { Switch } from '@mui/material';
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
  const [accountFormMode, setAccountFormMode] = useState('add');
  const [accountFormError, setAccountFormError] = useState('');

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({ 
    description: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    category: 'Other',
    accountId: ''
  });
  const [transactionFormMode, setTransactionFormMode] = useState('add');
  const [transactionFormError, setTransactionFormError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Pagination and search
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Account types options
  const accountTypes = ['checking', 'savings', 'credit', 'cash', 'other'];

  // Transaction categories options
  const transactionCategories = [
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

  // Load transactions when selected accounts change
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      loadTransactionsForSelectedAccounts();
    } else {
      setTransactions([]);
      setFilteredTransactions([]);
    }
  }, [selectedAccounts]);

  // Load accounts function
  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetchAccounts();
      if (response.data) {
        setAccounts(response.data);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.error('Failed to load accounts', error);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Load transactions for selected accounts
  const loadTransactionsForSelectedAccounts = async () => {
    setLoadingTransactions(true);
    try {
      const allTransactions = [];
      for (const account of selectedAccounts) {
        const response = await fetchTransactionsByAccount(account._id);
        if (response.data) {
          allTransactions.push(...response.data);
        }
      }
      
      // Sort transactions by date in descending order
      const sortedTransactions = allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setTransactions(sortedTransactions);
      setFilteredTransactions(sortedTransactions);
    } catch (error) {
      console.error('Failed to load transactions', error);
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Filter transactions based on search term
  const filteredAndSearchedTransactions = useMemo(() => {
    return filteredTransactions.filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredTransactions, searchTerm]);

  // Account dialog handlers
  const handleAddAccount = () => {
    setSelectedAccount(null);
    setAccountForm({ name: '', type: 'other', balance: '' });
    setAccountFormMode('add');
    setAccountFormError('');
    setAccountDialogOpen(true);
  };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setAccountForm({ 
      name: account.name, 
      type: account.type, 
      balance: account.balance,
      isHidden: account.isHidden 
    });
    setAccountFormMode('edit');
    setAccountFormError('');
    setAccountDialogOpen(true);
  };

  const handleAccountFormChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccountFormSubmit = async () => {
    const { name, type, balance, isHidden } = accountForm;
    if (!name || !type) {
      setAccountFormError('Name and type are required');
      return;
    }
    try {
      if (accountFormMode === 'add') {
        await createAccount({ 
          name, 
          type, 
          balance: parseFloat(balance) || 0,
          isHidden: false 
        });
      } else if (accountFormMode === 'edit' && selectedAccount) {
        await updateAccount(selectedAccount._id, { 
          name, 
          type, 
          balance: parseFloat(balance) || 0,
          isHidden 
        });
      }
      setAccountDialogOpen(false);
      await loadAccounts();
      // Dispatch accountsUpdated event
      const event = new Event('accountsUpdated');
      console.log('Dispatching accountsUpdated event');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to save account', error);
      setAccountFormError(error.response?.data?.message || 'Failed to save account');
    }
  };

  // Transaction dialog handlers
  const handleAddTransaction = () => {
    if (selectedAccounts.length === 0) {
      alert('Please select an account first');
      return;
    }
    setSelectedTransaction(null);
    setTransactionForm({ 
      description: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      category: 'Other',
      accountId: selectedAccounts[0]._id
    });
    setTransactionFormMode('add');
    setTransactionFormError('');
    setTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setTransactionForm({
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date ? transaction.date.split('T')[0] : '',
      category: transaction.category,
      accountId: transaction.accountId,
    });
    setTransactionFormMode('edit');
    setTransactionFormError('');
    setTransactionDialogOpen(true);
  };

  const handleTransactionFormChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionFormSubmit = async () => {
    const { description, amount, date, category, accountId } = transactionForm;
    if (!description || !amount || !date || !category || !accountId) {
      setTransactionFormError('All fields are required');
      return;
    }
    try {
      if (transactionFormMode === 'add') {
        await createTransaction(accountId, { 
          description, 
          amount: parseFloat(amount), 
          date, 
          category 
        });
      } else if (transactionFormMode === 'edit' && selectedTransaction) {
        await updateTransaction(selectedTransaction._id, { 
          description, 
          amount: parseFloat(amount), 
          date, 
          category 
        });
      }
      setTransactionDialogOpen(false);
      await loadTransactionsForSelectedAccounts();
    } catch (error) {
      console.error('Failed to save transaction', error);
      setTransactionFormError(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  // Delete handlers
  const handleDeleteAccount = async (account) => {
    if (!window.confirm(`Are you sure you want to delete account "${account.name}"? This will also delete related transactions.`)) {
      return;
    }
    try {
      await deleteAccount(account._id);
      await loadAccounts();
      // Dispatch accountsUpdated event
      const event = new Event('accountsUpdated');
      console.log('Dispatching accountsUpdated event');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to delete account', error);
      alert(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm(`Are you sure you want to delete transaction "${transaction.description}"?`)) {
      return;
    }
    try {
      await deleteTransaction(transaction._id);
      await loadTransactionsForSelectedAccounts();
    } catch (error) {
      console.error('Failed to delete transaction', error);
      alert(error.response?.data?.message || 'Failed to delete transaction');
    }
  };

  // Toggle account visibility
  const handleToggleAccountVisibility = async (account) => {
    try {
      console.log('Toggling account visibility:', account._id, !account.isHidden);
      await updateAccount(account._id, { isHidden: !account.isHidden });
      await loadAccounts();
      // Dispatch accountsUpdated event
      const event = new Event('accountsUpdated');
      console.log('Dispatching accountsUpdated event');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to toggle account visibility', error);
      alert(error.response?.data?.message || 'Failed to toggle account visibility');
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAccount}
        >
          Add Account
        </Button>
      </Box>

      {loadingAccounts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {accounts.map((account) => (
            <Grid item xs={12} sm={6} md={4} key={account._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="div">
                      {account.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type: {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                  </Typography>
                  <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                    ₹{account.balance.toFixed(2)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Tooltip title={account.isHidden ? 'Show in Transactions' : 'Hide from Transactions'}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleAccountVisibility(account)}
                    >
                      {account.isHidden ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Account">
                    <IconButton
                      size="small"
                      onClick={() => handleEditAccount(account)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Account">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAccount(account)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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
            value={accountForm.type}
            onChange={handleAccountFormChange}
          >
            {accountTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
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
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
          {accountFormError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {accountFormError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAccountFormSubmit} variant="contained">
            {accountFormMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onClose={() => setTransactionDialogOpen(false)}>
        <DialogTitle>
          {transactionFormMode === 'add' ? 'Add Transaction' : 'Edit Transaction'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            name="description"
            fullWidth
            value={transactionForm.description}
            onChange={handleTransactionFormChange}
          />
          <TextField
            margin="dense"
            label="Amount"
            name="amount"
            type="number"
            fullWidth
            value={transactionForm.amount}
            onChange={handleTransactionFormChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            label="Date"
            name="date"
            type="date"
            fullWidth
            value={transactionForm.date}
            onChange={handleTransactionFormChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Category"
            name="category"
            select
            fullWidth
            value={transactionForm.category}
            onChange={handleTransactionFormChange}
          >
            {transactionCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          {transactionFormMode === 'add' && (
            <TextField
              margin="dense"
              label="Account"
              name="accountId"
              select
              fullWidth
              value={transactionForm.accountId}
              onChange={handleTransactionFormChange}
            >
              {selectedAccounts.map((account) => (
                <MenuItem key={account._id} value={account._id}>
                  {account.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {transactionFormError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {transactionFormError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTransactionFormSubmit} variant="contained">
            {transactionFormMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
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
