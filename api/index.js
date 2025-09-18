export default async function handler(req, res) {
    // Log para sabermos que a função foi chamada
    console.log("API route '/api/generate-audio' foi acionada.");

    if (req.method !== 'POST') {
        console.log(`Método ${req.method} não permitido. Enviando resposta 405.`);
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { text } = req.body;
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = '3sIPB0HU61vlpMzHtxAs'; // Seu código de voz

    // Validação CRÍTICA: Verifica se a chave da API está configurada na Vercel
    if (!ELEVENLABS_API_KEY) {
        console.error("ERRO FATAL: A variável de ambiente ELEVENLABS_API_KEY não está configurada.");
        // Este é um erro de configuração do servidor, então enviamos um erro 500.
        return res.status(500).json({ error: 'Erro de configuração no servidor. A chave da API está faltando.' });
    }
    
    // Valida se o texto foi enviado pelo frontend
    if (!text) {
        console.error("Erro do Cliente: O 'text' está faltando no corpo da requisição.");
        return res.status(400).json({ error: 'O texto é obrigatório no corpo da requisição.' });
    }
    
    console.log(`Requisição recebida para o texto: "${text}"`);

    try {
        console.log("Enviando requisição para a API da ElevenLabs...");
        const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        console.log(`API da ElevenLabs respondeu com o código de status: ${elevenLabsResponse.status}`);

        // Trata erros vindos da API da ElevenLabs (ex: chave inválida, créditos esgotados)
        if (!elevenLabsResponse.ok) {
            const errorDetails = await elevenLabsResponse.json();
            console.error("A API da ElevenLabs retornou um erro:", errorDetails);
            return res.status(elevenLabsResponse.status).json({ 
                error: 'A API da ElevenLabs falhou em gerar o áudio.', 
                details: errorDetails 
            });
        }

        // Se deu tudo certo, pega os dados do áudio
        const audioBuffer = await elevenLabsResponse.arrayBuffer();
        console.log("Áudio recebido com sucesso da ElevenLabs. Enviando para o cliente.");

        // Envia o arquivo de áudio de volta para o navegador
        res.setHeader('Content-Type', 'audio/mpeg');
        res.status(200).send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("Ocorreu um erro inesperado ao contatar a ElevenLabs:", error);
        res.status(500).json({ error: 'Erro Interno do Servidor.', details: error.message });
    }
}
