const Sequelize = require('sequelize');
const util = require('./util');

const sequelize = new Sequelize(util.mysql_database, util.mysql_user, util.mysql_password, {
    logging: false,
    dialect: 'mysql',
    host: util.mysql_host,
});

module.exports ={
     sequelize};
