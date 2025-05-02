// src/controllers/aiController.js
const { getAICompletion, getAIStream } = require('../utils/aiClient');

exports.chatWithAI = async (req, res) => {
  try {
    const { messages, stream = false } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

    if (!stream) {
      // non-streaming path
      const reply = await getAICompletion(messages);
      return res.json({ reply });
    }

    // ─── streaming path ───────────────────────────────────────
    // tell Express we’ll be chunking JSON back
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // getAIStream() returns the NDJSON parser stream itself
    const parser = await getAIStream(messages);

    // open a JSON array in the response
    res.write('{"chunks":[');
    let first = true;

    parser.on('data', obj => {
      // each obj is e.g. { token: "Saving" } or { done: true }
      const chunk = JSON.stringify(obj);
      // comma-separate
      if (!first) res.write(',');
      res.write(chunk);
      first = false;
    });

    parser.on('end', () => {
      // close out the JSON
      res.write(']}');
      res.end();
    });

    parser.on('error', err => {
      console.error('Stream error:', err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
      else             res.end(); 
    });

  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.loadModel = async (_req, res) => {
    try {
        // a zero-prompt warm-up so the model’s weights get loaded
        await getAICompletion([], false);
        res.status(200).json({ message: 'Model loaded successfully' });
    } catch (err) {
        console.error('Model loading error:', err);
        res.status(500).json({ error: err.message });
    }
};
