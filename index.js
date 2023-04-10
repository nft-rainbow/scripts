const { sequelize, connect } = require('./db');
const { User, FiatLog, UserBalance, DepositOrder, MintTask, SponsorLog } = sequelize.models;
const { Op } = require('sequelize');
const { formatDateDime, writeToCsv, formatDate, currentMonth, lastMonth } = require('./utils');
const _ = require('lodash');
const { conflux } = require('./cfx.js');
const { default: axios } = require('axios');
const { Drip } = require('js-conflux-sdk');

// connect();

const SPONSOR_ADDRESS = 'cfx:aakk91pj0pzcbrjkefttdf27t072f4u8pj27znjbw0';

async function main() {
    // await fiatLog();
    // await userBalance();
    // await userBalanceByDay();
    // await rabbitShot();

    // let result = await getUserTx(SPONSOR_ADDRESS);
    await fetchAndSaveSponsorLog(SPONSOR_ADDRESS);

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
    let fiatLogs = await FiatLog.findAll({
        where: {
            amount: {[Op.ne]: 0},
            created_at: {
                [Op.lt]: new Date(currentMonth()),
                [Op.gt]: new Date(lastMonth()),
            }
        }
    });
    let items = [];
    for (let item of fiatLogs) {
        let user = users[item.user_id];
        let depositOrder;
        if (item.type === 1) {
            depositOrder = await DepositOrder.findByPk(item.meta.deposit_order_id);
        }
        items.push({
            UserId: item.user_id,
            Email: user.email,
            Amount: item.amount,
            Type: mapFiatTypeName(item.type),
            CreatedAt: formatDateDime(item.created_at),
            Address: item.meta?.address,
            WxOrderNo: depositOrder?.trade_no,
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

async function rabbitShot() {
    let items = await MintTask.findAll({
        where: {
            contract: 'cfx:acg2xnk5z9mttr76krur1rxafaj2z6fe5p06cbwwce',
            token_id: {
                [Op.gt]: 5
            }
        }
    });
    console.log(items.length);
    let results = {};
    let resultArray = [];
    for(let item of items) {
        if (results[item.mint_to] !== undefined) continue;
        let balance = await batchBalance(item.mint_to);
        console.log('checking ', item.mint_to, balance);
        results[item.mint_to] = balance;
        resultArray.push({
            Address: item.mint_to,
            Balance: balance,
        });
    }
    await writeToCsv('./RabbitShot.csv', resultArray);
}

const rabbitContract = conflux.Contract({
    address: 'cfx:acg2xnk5z9mttr76krur1rxafaj2z6fe5p06cbwwce',
    abi: require('../snapshot-tool/abi.json').ERC1155Enumerable
});

async function batchBalance(addr) {
    let balances = await rabbitContract.balanceOfBatch([addr, addr, addr, addr], [6, 7, 8, 9]).call({}, 64739494);
    return _.min(balances);
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
        case 5:
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

async function _getUserTx(account, skip, limit) {
    console.log('fetching', account, skip, limit);
    const HOST = 'https://api.confluxscan.net';
    const { data } = await axios.get(`${HOST}/account/transactions?account=${account}&from=${account}&skip=${skip}&limit=${limit}`);

    return data.data;
}

async function getUserTx(account) {
    let skip = 0;
    let limit = 50;
    let txs = [];
    // Get 'account' tx from Scan API
    while (true) {
        let {list, total} = await _getUserTx(account, skip, limit);
        txs = txs.concat(list);
        if (txs.length >= total) break;
        skip += limit;
    }
    // Get tx detail Info from RPC
    for(let i in txs) {
        let tx = txs[i];
        let txInfo = await conflux.cfx.getTransactionByHash(tx.hash);
        txs[i].txInfo = txInfo;
    }
    return txs;
}

async function fetchAndSaveSponsorLog(account) {
    const txs = await getUserTx(account);
    const sponsorContract = conflux.InternalContract('SponsorWhitelistControl');

    for(let tx of txs) {
        let value = new Drip(tx.value);
        let cfxCount = value.toCFX();
        let methodArg = sponsorContract.abi.decodeData(tx.txInfo.data);
        const contract = methodArg.object.contractAddr;
        let meta = {
            sponsor_at: new Date(tx.timestamp * 1000),
            type: tx.method.startsWith('setSponsorForCollateral') ? 2 : 1,
            value: parseInt(cfxCount),
            nonce: parseInt(tx.nonce),
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            contract,
            created_at: new Date(),
        };
        await SponsorLog.create(meta);
    }
}
