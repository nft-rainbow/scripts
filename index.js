const { sequelize, connect } = require('./db');
const { User, FiatLog, UserBalance } = sequelize.models;
const { Op } = require('sequelize');
const { formatDateDime, writeToCsv, formatDate } = require('./utils');
const _ = require('lodash');

// connect();

async function main() {
    await fiatLog();
    // await userBalance();
    // await userBalanceByDay();
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

/**
 22/12/1 0:00 - 22/12/31 23:59:59 的明细
    字段：扣费日期，扣费金额，UserID，Email，消费项目（若有），用户合约地址（若有）
 */
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
            CreatedAt: formatDateDime(item.created_at),
            Address: item.meta?.address,
        });
    }
    writeToCsv('./FiatLog.csv', items);
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
    writeToCsv('./UserBalance.csv', items);
}

async function userBalanceByDay() {
    let users = await getUsers();
    const items = [];
    for(let uid in users) {
        let user = users[uid];
        const count = await FiatLog.count({where: {user_id: user.id}})
        if (count === 0) continue;
        let logs = await FiatLog.findAll({where: {user_id: user.id, amount: {[Op.ne]: 0}}});
        logs = logs.map(log => ({
            user_id: log.user_id,
            amount: log.amount,
            type: log.type,
            created_at: formatDateDime(log.created_at),
            created_date: formatDate(log.created_at),
        }));
        let grouped = _.groupBy(logs, 'created_date');
        let groupedInArray = [];
        for(let date in grouped) {
            groupedInArray.push({
                date,
                logs: grouped[date],
            });
        }
        groupedInArray = _.orderBy(groupedInArray, ['date'], ['asc']);
        let balance = 0;
        for (let item of groupedInArray) {
            let {deposit, charge} = sumDepositAndCharge(item.logs);
            balance = balance + deposit + charge;
            items.push({
                Date: item.date,
                UserId: user.id,
                Email: user.email,
                Deposit: deposit,
                Charge: charge,
                Balance: balance,
            });
        }
    }
    writeToCsv('./UserBalanceInDay.csv', items);
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

function sumDepositAndCharge(items) {
    let deposit = 0;
    let charge = 0;
    for (let item of items) {
        if (item.type === 1) {
            deposit += item.amount;
        } else {
            charge += item.amount;
        }
    }
    return {deposit, charge};
}