import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { chatWithAI } from '../api';

const AIAdvisor = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const theme = useTheme();

  const isNearBottom = () => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Only auto-scroll when new messages are added
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    // Handle scroll events to determine if we should auto-scroll
    const handleScroll = () => {
      setShouldAutoScroll(isNearBottom());
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const newMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, newMessage]);
    setQuestion('');
    setLoading(true);
    setError('');
    setStreamingResponse('');
    setShouldAutoScroll(true); // Reset auto-scroll when sending new message

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
                // Only scroll if we're already near the bottom
                if (isNearBottom()) {
                  scrollToBottom();
                }
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
    <Box sx={{ 
      height: 'calc(100vh - 100px)', 
      display: 'flex', 
      flexDirection: 'column',
      maxWidth: '1000px',
      margin: '0 auto',
      p: 2
    }}>
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
        AI Financial Advisor
      </Typography>

      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 2
        }}
      >
        <Box 
          ref={chatContainerRef}
          sx={{ 
            flex: 1, 
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {messages.length === 0 && !loading && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              p: 4
            }}>
              <AIIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
              <Typography variant="h6" gutterBottom>
                Welcome to your AI Financial Advisor
              </Typography>
              <Typography variant="body1">
                Ask me anything about your finances, budgeting, investments, or financial planning.
              </Typography>
            </Box>
          )}

          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 1,
                alignItems: 'flex-start'
              }}
            >
              {msg.role === 'assistant' && (
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <AIIcon sx={{ fontSize: 20 }} />
                </Box>
              )}
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: msg.role === 'user' ? 'auto' : -8,
                    right: msg.role === 'user' ? -8 : 'auto',
                    width: 16,
                    height: 16,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                    transform: 'rotate(45deg)',
                    zIndex: 0
                  }
                }}
              >
                <Typography sx={{ position: 'relative', zIndex: 1 }}>
                  {msg.content}
                </Typography>
              </Paper>
              {msg.role === 'user' && (
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%',
                  bgcolor: 'grey.300',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <PersonIcon sx={{ fontSize: 20 }} />
                </Box>
              )}
            </Box>
          ))}

          {streamingResponse && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                gap: 1,
                alignItems: 'flex-start'
              }}
            >
              <Box sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0
              }}>
                <AIIcon sx={{ fontSize: 20 }} />
              </Box>
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: 'grey.100',
                  color: 'text.primary',
                  borderRadius: 2,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: -8,
                    width: 16,
                    height: 16,
                    bgcolor: 'grey.100',
                    transform: 'rotate(45deg)',
                    zIndex: 0
                  }
                }}
              >
                <Typography sx={{ position: 'relative', zIndex: 1 }}>
                  {streamingResponse}
                </Typography>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{ 
            p: 2, 
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask about your finances..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }
              }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              sx={{ 
                width: 48, 
                height: 48,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AIAdvisor; 