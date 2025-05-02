// src/controllers/aiController.js
const { getAICompletion, getAIStream } = require('../utils/aiClient');

exports.chatWithAI = async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'messages[] is required' });
        }
        // non-streaming path
        const reply = await getAICompletion(messages);
        return res.status(200).json({ reply });

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
