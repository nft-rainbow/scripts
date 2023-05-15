const { Sequelize } = require('sequelize');
const { db } = require('../config.json');
const defineUser = require('./User');
const defineFiatLog = require('./FiatLog');
const defineUserBalance = require('./UserBalance');
const defineDepositOrder = require('./DepositOrder');
const defineMintTask = require('./MintTask');
const defineSponsorLog = require('./SponsorLog');
const defineWalletUser = require('./WalletUser');

const sequelize = new Sequelize(db.database, db.user, db.password, {
    host: db.host,
    port: db.port,
    dialect: 'mysql',
    logging: false,
    timezone: 'Asia/Shanghai',
});

defineUser(sequelize);
defineFiatLog(sequelize);
defineUserBalance(sequelize);
defineDepositOrder(sequelize);
defineMintTask(sequelize);
defineSponsorLog(sequelize);
defineWalletUser(sequelize);

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