const axios = require('axios');
const ndjson = require('ndjson'); // npm install ndjson

const ollamaHost = process.env.OLLAMA_HOST;
const model = process.env.MODEL_NAME;

exports.getAICompletion = async (messages) => {
    // 1) Empty array → just load the model into memory
    if (!messages.length) {
        const resp = await axios.post(
            `${ollamaHost}/api/chat`,
            { model, messages },
            { headers: { 'Content-Type': 'application/json' } }
        );
        // resp.data.done_reason will be "load" and message.content === ""
        return resp.data.message?.content ?? null;
    }

    // 2) Non-streaming chat completion
    const resp = await axios.post(
        `${ollamaHost}/api/chat`,
        { model, messages, stream: false },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return resp.data.message?.content ?? null;
};

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
