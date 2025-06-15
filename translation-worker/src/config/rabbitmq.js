const amqp = require('amqplib');
require('dotenv').config();

let channel = null;

const connectRabbitMQ = async () => {
    if (channel) return channel;

    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(process.env.QUEUE_NAME, {durable: true});
        console.log('RabbitMQ connected and queue asserted');
        return channel;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        setTimeout(connectRabbitMQ, 5000);
    }
};

const getChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel is not available. Please connect first.");
    }
    return channel;
}

module.exports = {connectRabbitMQ, getChannel};
