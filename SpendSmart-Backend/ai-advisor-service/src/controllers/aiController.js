// src/controllers/aiController.js
const { getAICompletion, getAIStream } = require('../utils/aiClient');
const http = require('http');

exports.chatWithAI = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

    // Check if this is a streaming request
    const isStreaming = req.path.endsWith('/stream');

    if (!isStreaming) {
      // non-streaming path
      const reply = await getAICompletion(messages);
      console.log('AI Response:', reply);
      return res.json({ reply });
    }

    // ─── streaming path ───────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const parser = await getAIStream(messages);
    let fullResponse = '';

    parser.on('data', obj => {
      if (obj.done) {
        console.log('Final AI Response:', fullResponse);
        res.write(`data: [DONE]\n\n`);
        res.write(`data: ${fullResponse}\n\n`);
        return;
      }
      // Send each token as a server-sent event
      fullResponse += obj.message.content || '';
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    });

    parser.on('end', () => {
      res.end();
    });

    parser.on('error', err => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      parser.destroy();
    });

  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.loadModel = async (_req, res) => {
    try {
        // a zero-prompt warm-up so the model's weights get loaded
        await getAICompletion([], false);
        res.status(200).json({ message: 'Model loaded successfully' });
    } catch (err) {
        console.error('Model loading error:', err);
        res.status(500).json({ error: err.message });
    }
};
