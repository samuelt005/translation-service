const axios = require('axios');
require('dotenv').config();

if (!process.env.DEEPL_API_KEY) {
    throw new Error("DEEPL_API_KEY is not defined in the environment variables.");
}

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

/**
 * Traduz um texto usando a DeepL API.
 * @param {string} text - O texto a ser traduzido.
 * @param {string} targetLanguage - O código do idioma de destino (ex: 'pt', 'es').
 * @returns {Promise<string>} O texto traduzido.
 */
const deeplTranslate = async (text, targetLanguage) => {
    console.log(`[DeepL] Translating "${text}" to ${targetLanguage}...`);

    try {
        const response = await axios.post(
            DEEPL_API_URL,
            {
                text: [text],
                target_lang: targetLanguage.toUpperCase(),
            },
            {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const translatedText = response.data.translations[0].text;
        console.log(`[DeepL] Translation successful.`);
        return translatedText;

    } catch (error) {
        let errorMessage = 'DeepL API request failed.';
        if (error.response) {
            errorMessage = `DeepL API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`;
        } else if (error.request) {
            errorMessage = 'DeepL API request made but no response received.';
        }

        console.error(`[DeepL] Error: ${errorMessage}`);
        throw new Error(errorMessage);
    }
};

module.exports = {
    translate: deeplTranslate,
};
