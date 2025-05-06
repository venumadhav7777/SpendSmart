import React, { useEffect, useState } from 'react';
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
  TablePagination
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { fetchTransactionsFromDB, refreshTransactions, fetchTransactions, createPublicToken, exchangePublicToken, syncTransactions } from '../api';
import SectionCard from '../components/SectionCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleFetchTransactions = async () => {
    try {
      console.log("Fetching transactions from Plaid");
      // Get current date
      const endDate = new Date();
      const startDate = "2023-01-01";
      
      // Format dates to YYYY-MM-DD
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };

      console.log("startDate", startDate, "endDate", formatDate(endDate));

      const response = await fetchTransactions(
        startDate,
        formatDate(endDate)
      );
      // console.log("Response", response);
      
      if (response.data && response.data.transactions) {
        setTransactions(response.data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError('Failed to fetch transactions from Plaid.');
      throw err;
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchTransactionsFromDB();
      if (response.data.transactions && response.data.transactions.length > 0) {
        setTransactions(response.data.transactions);
      } else {
        // If no transactions in DB, fetch from Plaid
        console.log("No transactions in DB, fetching from Plaid");
        await handleFetchTransactions();
      }
    } catch (err) {
      setError('Failed to fetch transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async () => {
    try {
      await syncTransactions();
    } catch (err) {
      setError('Failed to sync transactions.');
    }
  };

  const handleRefreshTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      console.log("Refreshing Transactions")
      await refreshTransactions();
      // Sync incremental updates
      console.log("Syncing Transactions")
      await handleSyncTransactions();
      // Load transactions from DB
      await loadTransactions();
    } catch (err) {
      setError('Failed to refresh transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedTransactions = React.useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (orderBy === 'date') {
        return order === 'asc' 
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      if (orderBy === 'amount') {
        return order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (orderBy === 'name') {
        return order === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return 0;
    });
  }, [transactions, order, orderBy]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const processTransactions = (transactions) => {
    const categories = {};
    transactions.forEach((tx) => {
      const category = tx.category || tx.name;
      if (!categories[category]) {
        categories[category] = { total: 0, color: getRandomColor() };
      }
      categories[category].total += Math.abs(tx.amount);
    });
    return Object.entries(categories).map(([category, data]) => ({
      category,
      total: data.total,
      color: data.color
    }));
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
        Transactions
      </Typography>
      <SectionCard sx={{ mb: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleRefreshTransactions}
            startIcon={<RefreshIcon />}
          >
            Refresh Transactions
          </Button>
        </Box>
        {loading && <CircularProgress />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="transactions table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'date'}
                    direction={orderBy === 'date' ? order : 'asc'}
                    onClick={() => handleRequestSort('date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Description
                  </TableSortLabel>
                </TableCell>
                <TableCell>Category</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'amount'}
                    direction={orderBy === 'amount' ? order : 'asc'}
                    onClick={() => handleRequestSort('amount')}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tx.name}
                      {tx.merchant_name && (
                        <MuiTooltip title="Merchant">
                          <InfoIcon fontSize="small" color="action" />
                        </MuiTooltip>
                      )}
                    </Box>
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
                        tx.category?.map((cat, index) => (
                          <Chip
                            key={index}
                            label={cat}
                            size="small"
                            variant="outlined"
                            sx={{ maxWidth: 120, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                          />
                        ))
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {(tx.mapped_category?.primary === 'INCOME' || tx.mapped_category?.primary === 'TRANSFER_IN') ? (
                        <>
                          <TrendingUpIcon style={{ color: '#4CAF50' }} fontSize="small" />
                          <Typography style={{ color: '#4CAF50', fontWeight: 500 }}>
                            {formatAmount(Math.abs(tx.amount))}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <TrendingDownIcon style={{ color: '#F44336' }} fontSize="small" />
                          <Typography style={{ color: '#F44336', fontWeight: 500 }}>
                            {formatAmount(Math.abs(tx.amount))}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tx.pending ? 'Pending' : 'Completed'}
                      color={tx.pending ? 'warning' : 'success'}
                      size="small"
                    />
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
          />
        </TableContainer>
      </SectionCard>
    </Box>
  );
}

export default Transactions;