const express = require('express');
const cors = require('cors');
const {createTranslation, getTranslationStatus} = require('./controllers/translationController');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Translation API is running!');
});

app.post('/translations', createTranslation);
app.get('/translations/:requestId', getTranslationStatus);

module.exports = app;
