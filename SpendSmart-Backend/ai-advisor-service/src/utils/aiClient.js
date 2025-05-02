const axios = require('axios');
const ndjson = require('ndjson'); // npm install ndjson

const ollamaHost = process.env.OLLAMA_HOST;
const model = process.env.MODEL_NAME;

exports.getAICompletion = async (messages) => {
    // non-streaming (existing behavior)
    const resp = await axios.post(
        `${ollamaHost}/api/chat`,
        { model, messages, stream: false },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return resp.data.message?.content ?? null;
}

exports.getAIStream = async (messages) => {
  const resp = await axios.post(
    `${ollamaHost}/api/chat`,
    { model, messages },
    { responseType: 'stream' }
  );

  // resp.data is a Node.js Readable stream of NDJSON frames
  return resp.data.pipe(ndjson.parse());
};


exports.checkModelAvailability = async (model) => {
    const resp = await axios.get(`${ollamaHost}/api/tags`);
    console.log("Local Models Response", resp.data);
    if (!resp.data.models) {
        return false;
    }
    const modelNames = resp.data.models.map(m => m.name);
    console.log("Local Model Names", modelNames);
    if (!modelNames.includes(model)) {
        return false;
    }
    return true;
}

exports.pullModel = async (model) => {
    const resp = await axios.post(`${ollamaHost}/api/pull`, { model, stream: false });
    console.log("Pull Model Response", resp.data);
    return resp.data.status;
}
