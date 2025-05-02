// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const { checkModelAvailability, pullModel } = require('./utils/aiClient');

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Example simple route
app.get('/health', (_req, res) => {
  res.json({ message: 'SpendSmart Microservice Running!' });
});

const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai-advisor', aiRoutes);

const PORT = process.env.PORT || 3004;
const model = process.env.MODEL_NAME;
const provider = process.env.MODEL_PROVIDER;
const ollamaHost = process.env.OLLAMA_HOST;

app.listen(PORT, async () => {
  if (provider === 'ollama') {
    if (!ollamaHost) {
      throw new Error('OLLAMA_HOST is not set');
    }
    const isModelAvailable = await checkModelAvailability(model);
    if (!isModelAvailable) {
      await pullModel(model);
    }
    console.log(`Server running on port ${PORT} with Ollama model "${model}"`);
  } else {
    throw new Error(`Unsupported MODEL_PROVIDER: ${provider}`);
  }
});
