import React, { useEffect, useState, useMemo } from 'react';
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
  Chip,
  IconButton,
  Tooltip as MuiTooltip,
  TableSortLabel,
  Alert,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  MenuItem,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  fetchTransactions,
  fetchAccounts,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../api';
import SectionCard from '../components/SectionCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

import { useAuth } from '../contexts/AuthContext';

// Import export function for PDF
import { exportTransactionsToPDF } from '../utils/pdfExport';

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

function Transactions() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    accountId: '',
  });
  const [transactionFormMode, setTransactionFormMode] = useState('add');
  const [transactionFormError, setTransactionFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');

  // Add new state for category and account filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Helper to determine if transaction is income or transfer_in
  const isIncomeTransaction = (tx) => {
    const incomeCategories = ['Income', 'Transfer In', 'transfer_in', 'income'];
    
    // Check mapped_category if it exists
    if (tx.mapped_category) {
      const primary = tx.mapped_category.primary.toLowerCase();
      const description = tx.mapped_category.description.toLowerCase();
      if (incomeCategories.some(cat => primary.includes(cat.toLowerCase()) || description.includes(cat.toLowerCase()))) {
        return true;
      }
    }

    // Check category
    if (tx.category) {
      const categoryStr = tx.category.toLowerCase();
      if (incomeCategories.some(cat => categoryStr.includes(cat.toLowerCase()))) {
        return true;
      }
    }

    // Check name
    if (tx.name) {
      const nameLower = tx.name.toLowerCase();
      if (incomeCategories.some(cat => nameLower.includes(cat.toLowerCase()))) {
        return true;
      }
    }

    return false;
  };

  // Transaction categories
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

  // Load transactions and accounts on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }

    // Add event listeners for data updates
    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('transactionsUpdated', handleDataUpdate);
    window.addEventListener('accountsUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('transactionsUpdated', handleDataUpdate);
      window.removeEventListener('accountsUpdated', handleDataUpdate);
    };
  }, [isAuthenticated]);

  // Load data function
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Fetching transactions and accounts...');
      const [transactionsRes, accountsRes] = await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
      ]);

      console.log('Accounts response:', accountsRes);
      console.log('Transactions response:', transactionsRes);

      // Filter out transactions from hidden accounts
      const visibleAccounts = accountsRes.data.filter(account => !account.isHidden);
      console.log('Visible accounts:', visibleAccounts);

      const visibleAccountIds = new Set(visibleAccounts.map(account => account._id));
      const visibleTransactions = transactionsRes.data.filter(
        transaction => visibleAccountIds.has(transaction.accountId)
      );

      setTransactions(visibleTransactions);
      setAccounts(visibleAccounts);

      // Set default account if none selected and accounts are available
      if (visibleAccounts.length > 0 && !transactionForm.accountId) {
        console.log('Setting default account:', visibleAccounts[0]);
        setTransactionForm(prev => ({
          ...prev,
          accountId: visibleAccounts[0]._id
        }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      console.error('Error details:', error.response?.data);
      setTransactions([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on search term, category, and account
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.category?.toLowerCase().includes(searchLower) ||
        transaction.merchant_name?.toLowerCase().includes(searchLower) ||
        transaction.amount?.toString().includes(searchTerm) ||
        formatDate(transaction.date).toLowerCase().includes(searchLower) ||
        accounts.find(acc => acc._id === transaction.accountId)?.name?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = !selectedCategory || transaction.category === selectedCategory;

      // Account filter
      const matchesAccount = !selectedAccount || transaction.accountId === selectedAccount;

      return matchesSearch && matchesCategory && matchesAccount;
    });
  }, [transactions, searchTerm, selectedCategory, selectedAccount, accounts]);

  // Sorting handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (orderBy === 'date') {
        return order === 'asc' 
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      if (orderBy === 'name') {
        return order === 'asc'
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description);
      }
      if (orderBy === 'amount') {
        return order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return 0;
    });
  }, [filteredTransactions, order, orderBy]);

  // Transaction dialog handlers
  const handleAddTransaction = () => {
    console.log('Current accounts:', accounts);
    setSelectedTransaction(null);
    setTransactionForm({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      accountId: accounts.length > 0 ? accounts[0]._id : '',
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
      date: transaction.date.split('T')[0],
      category: transaction.category,
      accountId: transaction.accountId,
    });
    setTransactionFormMode('edit');
    setTransactionFormError('');
    setTransactionDialogOpen(true);
  };

  const handleTransactionFormChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTransactionFormSubmit = async () => {
    const { description, amount, date, category, accountId } = transactionForm;
    if (!description || !amount || !date || !category || !accountId) {
      setTransactionFormError('All fields are required');
      return;
    }
    try {
      let finalAmount = parseFloat(amount);
      // Always use positive amount for income
      if (category.toLowerCase() === 'income') {
        finalAmount = Math.abs(finalAmount);
      }
      // Optionally, ensure expenses are positive (backend expects positive, subtracts from balance)
      if (category.toLowerCase() !== 'income') {
        finalAmount = Math.abs(finalAmount);
      }
      const txData = {
        description,
        amount: finalAmount,
        date,
        category,
      };
      console.log('Submitting transaction:', txData, 'Account:', accountId);
      if (transactionFormMode === 'add') {
        await createTransaction(accountId, txData);
      } else if (transactionFormMode === 'edit' && selectedTransaction) {
        await updateTransaction(selectedTransaction._id, txData);
      }
      setTransactionDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save transaction', error);
      setTransactionFormError(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm(`Are you sure you want to delete transaction "${transaction.description}"?`)) {
      return;
    }
    try {
      await deleteTransaction(transaction._id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete transaction', error);
      alert(error.response?.data?.message || 'Failed to delete transaction');
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

  const handleExportPDF = () => {
    exportTransactionsToPDF(transactions);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Transactions</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleExportPDF}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.3s ease'
            }}
          >
            Export to PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddTransaction}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.3s ease'
            }}
          >
            Add Transaction
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4, bgcolor: 'background.paper', transition: 'background-color 0.3s ease' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search Transactions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search transactions..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      '& > fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {transactionCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Account</InputLabel>
                <Select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  label="Account"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Accounts</MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: 'background.paper', transition: 'background-color 0.3s ease' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Account</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((tx) => (
                <TableRow
                  key={tx.transaction_id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{formatDate(tx.date)}</TableCell>
                  <TableCell>
                    {tx.description}
                    {tx.merchant_name && (
                      <MuiTooltip title="Merchant">
                        <InfoIcon fontSize="small" color="action" />
                      </MuiTooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {tx.mapped_category ? (
                        <>
                          <Chip
                            label={tx.mapped_category.primary
                              .replace(/_/g, ' ')
                              .toLowerCase()
                              .replace(/\b\w/g, c => c.toUpperCase())}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ maxWidth: 120, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                          />
                          <Chip
                            label={tx.mapped_category.description}
                            size="small"
                            variant="outlined"
                            sx={{ maxWidth: 180, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                          />
                        </>
                      ) : (
                        <Chip
                          label={tx.category}
                          size="small"
                          variant="outlined"
                          sx={{ maxWidth: 120, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {accounts.find((acc) => acc._id === tx.accountId)?.name}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: isIncomeTransaction(tx) ? 'success.main' : 'error.main',
                    }}
                  >
                    {isIncomeTransaction(tx) ? '+' : '-'}Rs. {formatAmount(Math.abs(tx.amount))}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTransaction(tx)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTransaction(tx)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={sortedTransactions.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
          />
        </TableContainer>
      </Card>

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
              error={!transactionForm.accountId}
              helperText={!transactionForm.accountId ? "Please select an account" : ""}
            >
              {accounts.map((account) => {
                console.log('Rendering account option:', account);
                return (
                  <MenuItem key={account._id} value={account._id}>
                    {account.name} ({account.type})
                  </MenuItem>
                );
              })}
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
          <Button 
            onClick={handleTransactionFormSubmit} 
            variant="contained"
            disabled={!transactionForm.accountId && transactionFormMode === 'add'}
          >
            {transactionFormMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Transactions;
