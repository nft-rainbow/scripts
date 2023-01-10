const { sequelize, connect } = require('./db');
const { stringify } = require('csv-stringify/sync');
const fs = require('fs');
const { User, FiatLog, UserBalance } = sequelize.models;
const { Op } = require('sequelize');
const { formatDate } = require('./utils');

// connect();

async function main() {
    await fiatLog();
    await userBalance();
    console.log('Finished');
}

main().catch(console.log)

async function getUsers() {
    let users = await User.findAll();
    let usersMap = {};
    for (let user of users) {
        usersMap[user.id] = user;
    }
    return usersMap;
}

async function fiatLog() {
    let users = await getUsers();
    let fiatLogs = await FiatLog.findAll({where: {amount: {[Op.ne]: 0}}});
    let items = [];
    for (let item of fiatLogs) {
        let user = users[item.user_id];
        items.push({
            UserId: item.user_id,
            Email: user.email,
            Amount: item.amount,
            Type: mapFiatTypeName(item.type),
            CreatedAt: formatDate(item.created_at),
        });
    }
    const csvStr = stringify(items, {header: true});
    fs.writeFileSync('./FiatLog.csv', csvStr);
}

async function userBalance() {
    let users = await getUsers();
    let userBalance = await UserBalance.findAll({where: {balance: {[Op.gt]: 0}}});
    let items = [];
    for (let item of userBalance) {
        let u = users[item.user_id];
        let totalCharge = await FiatLog.sum('amount', {where: {user_id: item.user_id, type: 1}});
        let totalConsume = await FiatLog.sum('amount', {where: {user_id: item.user_id, type: {[Op.gt]: 1}}});
        items.push({
            UserId: item.user_id,
            Email: u.email,
            Balance: item.balance,
            TotalCharge: totalCharge,
            TotalConsume: totalConsume
        });
    }
    const csvStr = stringify(items, {header: true});
    fs.writeFileSync('./UserBalance.csv', csvStr);
}

function mapFiatTypeName(type) {
    switch (type) {
        case 1:
            return 'Deposit';
        case 2:
            return 'Withdraw';
        case 3:
            return 'Pay Gas';
        case 4:
            return 'Pay Storage';
        case 4:
            return 'Pay API';
        default:
            return 'Other';
    }
}