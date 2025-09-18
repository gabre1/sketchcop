const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// A chave da API será lida das Environment Variables do Vercel
const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = '3sIPB0HU61vlpMzHtxAs';

app.post('/api', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'O texto não pode ser vazio.' });
    }
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const headers = {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
    };
    const data = {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    };

    try {
        const response = await axios.post(url, data, { headers: headers, responseType: 'stream' });
        res.setHeader('Content-Type', 'audio/mpeg');
        response.data.pipe(res);
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Erro ao contatar a API da ElevenLabs:', errorMessage);
        res.status(500).json({ error: 'Falha ao gerar o áudio.', details: errorMessage });
    }
});

// Vercel vai gerenciar o servidor, então não precisamos de app.listen
module.exports = app;
