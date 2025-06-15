const {v4: uuidv4} = require('uuid');
const httpStatus = require('http-status');
const Translation = require('../models/translation');
const {getChannel} = require('../config/rabbitmq');

const createTranslation = async (req, res) => {
    const {text, targetLanguage} = req.body;

    if (!text || !targetLanguage) {
        return res.status(httpStatus.BAD_REQUEST).json({error: 'Text and targetLanguage are required.'});
    }

    const requestId = uuidv4();

    try {
        const newTranslation = await Translation.create({
            requestId,
            originalText: text,
            targetLanguage,
            status: 'queued',
        });

        const channel = getChannel();
        const queue = process.env.QUEUE_NAME;
        const message = {
            requestId,
            text,
            targetLanguage
        };

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {persistent: true});

        return res.status(httpStatus.ACCEPTED).json({
            message: 'Translation request received and is being processed.',
            requestId: newTranslation.requestId,
        });
    } catch (error) {
        console.error('Error creating translation request:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: 'Failed to process request.'});
    }
};

const getTranslationStatus = async (req, res) => {
    const {requestId} = req.params;

    try {
        const translation = await Translation.findOne({where: {requestId}});

        if (!translation) {
            return res.status(httpStatus.NOT_FOUND).json({error: 'Translation request not found.'});
        }

        return res.status(httpStatus.OK).json(translation);
    } catch (error) {
        console.error('Error fetching translation status:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: 'Failed to fetch status.'});
    }
};

module.exports = {
    createTranslation,
    getTranslationStatus,
};
