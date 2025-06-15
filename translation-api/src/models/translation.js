const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Translation = sequelize.define('Translation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    requestId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
    },
    originalText: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    targetLanguage: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    translatedText: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('queued', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'queued',
    },
    errorMessage: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
});

module.exports = Translation;
