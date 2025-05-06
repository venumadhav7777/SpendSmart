import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { chatWithAI } from '../api';
import SectionCard from './SectionCard';

function AIAdvisor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    setError('');
    setStreamingResponse('');

    try {
      const response = await chatWithAI([...messages, newMessage]);
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI advisor');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setMessages(prev => [...prev, { role: 'assistant', content: accumulatedResponse }]);
              setStreamingResponse('');
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.message?.content) {
                accumulatedResponse += parsed.message.content;
                setStreamingResponse(accumulatedResponse);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError('Failed to get response from AI advisor.');
      console.error('AI chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
        AI Financial Advisor
      </Typography>
      
      <Box sx={{ height: '400px', overflowY: 'auto', mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                color: msg.role === 'user' ? 'white' : 'text.primary'
              }}
            >
              <Typography>{msg.content}</Typography>
            </Paper>
          </Box>
        ))}
        {streamingResponse && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper sx={{ p: 2, maxWidth: '70%', bgcolor: 'grey.100' }}>
              <Typography>{streamingResponse}</Typography>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your financial advisor..."
          disabled={loading}
          sx={{ flex: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !input.trim()}
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        >
          Send
        </Button>
      </Box>
    </SectionCard>
  );
}

export default AIAdvisor; 