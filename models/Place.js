const Sequelize = require('sequelize');
const sequelize = require('../util/database').sequelize;

const Place = sequelize.define('Place', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: Sequelize.STRING,
    image_URL: Sequelize.STRING,
    description: Sequelize.TEXT,
    vote: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
});

module.exports = Place;