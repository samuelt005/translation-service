require('dotenv').config();
const {connectRabbitMQ} = require('./config/rabbitmq');
const sequelize = require('./config/database');
const Translation = require('./models/translation');
const {translate} = require('./services/translationService');

const startWorker = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        const channel = await connectRabbitMQ();
        const queue = process.env.QUEUE_NAME;

        console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const messageContent = JSON.parse(msg.content.toString());
                const {requestId, text, targetLanguage} = messageContent;

                console.log(`[x] Received requestId: ${requestId}`);

                const translationRecord = await Translation.findOne({where: {requestId}});

                if (!translationRecord) {
                    console.error(`Record with requestId ${requestId} not found.`);
                    channel.ack(msg);
                    return;
                }

                try {
                    await translationRecord.update({status: 'processing'});

                    const translatedText = await translate(text, targetLanguage);

                    await translationRecord.update({status: 'completed', translatedText});
                    console.log(`[+] Translation for ${requestId} completed successfully.`);

                } catch (error) {
                    console.error(`[!] Failed to translate ${requestId}:`, error.message);
                    await translationRecord.update({status: 'failed', errorMessage: error.message});
                } finally {
                    channel.ack(msg);
                }
            }
        }, {
            noAck: false
        });
    } catch (error) {
        console.error('Failed to start worker:', error);
        process.exit(1);
    }
};

startWorker();
