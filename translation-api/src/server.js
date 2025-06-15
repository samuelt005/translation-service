require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
const {connectRabbitMQ} = require('./config/rabbitmq');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        await sequelize.sync();
        console.log('All models were synchronized successfully.');

        await connectRabbitMQ();

        app.listen(PORT, () => {
            console.log(`Translation API listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start the server:', error);
        process.exit(1);
    }
};

startServer();
