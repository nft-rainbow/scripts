const { Sequelize } = require('sequelize');
const { db } = require('../config.json');
const defineUser = require('./User');
const defineFiatLog = require('./FiatLog');
const defineUserBalance = require('./UserBalance');

const sequelize = new Sequelize(db.database, db.user, db.password, {
    host: db.host,
    port: db.port,
    dialect: 'mysql',
});

defineUser(sequelize);
defineFiatLog(sequelize);
defineUserBalance(sequelize);

async function connect() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = {
    connect,
    sequelize
}