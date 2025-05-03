import React, { useState } from 'react';
import { Typography, Box, TextField, Button, CircularProgress } from '@mui/material';

function AIAssistant() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setResponse('');
    try {
      // Placeholder for AI assistant API call
      // Replace with actual API call when available
      setTimeout(() => {
        setResponse('This is a placeholder response from the AI Assistant.');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setResponse('Failed to get response from AI Assistant.');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>AI Assistant</Typography>
      <TextField
        label="Ask a question"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        multiline
        rows={4}
        margin="normal"
      />
      <Button variant="contained" onClick={handleAsk} disabled={loading || !query}>
        Ask
      </Button>
      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {response && (
        <Box sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
          <Typography>{response}</Typography>
        </Box>
      )}
    </Box>
  );
}

export default AIAssistant;
