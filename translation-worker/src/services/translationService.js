const dictionary = {
    'hello': {'pt': 'olá', 'es': 'hola', 'fr': 'bonjour'},
    'world': {'pt': 'mundo', 'es': 'mundo', 'fr': 'monde'},
    'how are you?': {'pt': 'como você está?', 'es': '¿cómo estás?', 'fr': 'comment ça va?'},
};

const mockTranslate = async (text, targetLanguage) => {
    console.log(`Translating "${text}" to ${targetLanguage}...`);

    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    if (Math.random() < 0.1) {
        throw new Error('Translation service is temporarily unavailable.');
    }

    const lowerText = text.toLowerCase();
    const translation = dictionary[lowerText]?.[targetLanguage];

    if (translation) {
        return translation.charAt(0).toUpperCase() + translation.slice(1);
    } else {
        throw new Error(`Text "${text}" cannot be translated to ${targetLanguage}.`);
    }
};

module.exports = {mockTranslate};
