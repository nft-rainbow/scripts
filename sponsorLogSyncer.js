const { default: axios } = require('axios');
const { Drip } = require('js-conflux-sdk');
const { conflux } = require('./cfx.js');
const { sequelize, connect } = require('./db');
const { SponsorLog } = sequelize.models;
const config = require('./config.json');

const sponsorContract = conflux.InternalContract('SponsorWhitelistControl');
const SPONSOR_ADDRESS = config.sponsorAddress;

main();

async function main() {
    setInterval(async function() {
        try {
            await fetchAndSaveSponsorLog(SPONSOR_ADDRESS);
        }catch(e) {
            console.log(new Date(), 'fetchAndSaveSponsorLog error', e);
        }
    }, 5 * 60 * 1000);
}

async function fetchAndSaveSponsorLog(account) {
    const txs = await getUserTx(account);

    for(let tx of txs) {
        let value = new Drip(tx.value);
        let cfxCount = value.toCFX();
        let methodArg = sponsorContract.abi.decodeData(tx.txInfo.data);
        const contract = methodArg.object.contractAddr;
        let meta = {
            sponsor_at: new Date(tx.timestamp * 1000),
            type: tx.method.startsWith('setSponsorForCollateral') ? 2 : 1, // 1-gas 2-storage
            value: parseInt(cfxCount),
            nonce: parseInt(tx.nonce),
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            contract,
            created_at: new Date(),
        };

        let exist = await SponsorLog.findOne({ where: { nonce: meta.nonce } });
        if (exist) {
            continue;
        }

        try {
            await SponsorLog.create(meta);
        } catch(e) {
            if (e.message !== 'Validation error') {
                console.log('Log create error', e);
            }
        }

        await wait(2000);
    }
}

async function getUserTx(account, limit = 100) {
    let skip = 0;
    let txs = [];
    // Get 'account' tx from Scan API
    let {list, total} = await _getUserTx(account, skip, limit);
    txs = txs.concat(list);
    // Get tx detail Info from RPC
    for(let i in txs) {
        let tx = txs[i];
        let txInfo = await conflux.cfx.getTransactionByHash(tx.hash);
        txs[i].txInfo = txInfo;
    }
    return txs;
}

async function getAllUserTx(account) {
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

async function _getUserTx(account, skip, limit) {
    const HOST = 'https://api.confluxscan.net';
    const { data } = await axios.get(`${HOST}/account/transactions?account=${account}&from=${account}&skip=${skip}&limit=${limit}`);
    return data.data;
}

function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}