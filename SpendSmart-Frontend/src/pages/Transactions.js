import React, { useEffect, useState } from 'react';
import { Typography, Box, Button, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import { fetchTransactions, syncTransactions, refreshTransactions } from '../api';
import SectionCard from '../components/SectionCard';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchTransactions('2023-01-01', '2025-12-31');
      setTransactions(response.data.transactions || []);
    } catch (err) {
      setError('Failed to fetch transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      await syncTransactions(500);
      await loadTransactions();
    } catch (err) {
      setError('Failed to sync transactions.');
      setLoading(false);
    }
  };

  const handleRefreshTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      await refreshTransactions();
      await loadTransactions();
    } catch (err) {
      setError('Failed to refresh transactions.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
        Transactions
      </Typography>
      <SectionCard sx={{ mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={loadTransactions} sx={{ mr: 1 }}>
            Fetch Transactions
          </Button>
          <Button variant="contained" onClick={handleSyncTransactions} sx={{ mr: 1 }}>
            Sync Transactions
          </Button>
          <Button variant="contained" onClick={handleRefreshTransactions}>
            Refresh Transactions
          </Button>
        </Box>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        <List sx={{ mt: 2 }}>
          {transactions.map((tx) => (
            <ListItem key={tx.id} sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <ListItemText
                primary={`${tx.name} - $${tx.amount}`}
                secondary={new Date(tx.date).toLocaleDateString()}
              />
            </ListItem>
          ))}
        </List>
      </SectionCard>
    </Box>
  );
}

export default Transactions;
