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
            fetchAndSaveSponsorLog(SPONSOR_ADDRESS);
        }catch(e) {
            console.log(new Date(), 'fetchAndSaveSponsorLog error', e);
        }
    }, 5 * 60 * 1000);
}

async function fetchAndSaveSponsorLog(account) {
    let lastItems = await SponsorLog.findAll({
        offset: 1, // skip the first item, which is a refunded tx
        limit: 1,
        order: [
            ['nonce', 'DESC']
        ]
    });
    let dbLastNonce = lastItems[0] ? lastItems[0].nonce : 0;
    console.log(new Date(), 'DB last nonce:', dbLastNonce);

    let blockChainLastNonce = await conflux.cfx.getNextNonce(account);
    console.log(new Date(), 'BlockChain last nonce:', blockChainLastNonce);
    
    if (BigInt(dbLastNonce + 1) == blockChainLastNonce) return; // no need to update

    const txs = await getAllUserTx(account, skip = dbLastNonce, 100, 'ASC');

    for(let tx of txs) {
        await createSponsorLogForTx(tx);
    }
}

async function createSponsorLogForTx(tx) {
    let nonce = parseInt(tx.nonce);

    let exist = await SponsorLog.findOne({ where: { nonce: meta.nonce } });
    if (exist) return false;

    let value = new Drip(tx.value);
    let cfxCount = value.toCFX();
    let methodArg = sponsorContract.abi.decodeData(tx.txInfo.data);
    const contract = methodArg.object.contractAddr;
    let meta = {
        sponsor_at: new Date(tx.timestamp * 1000),
        type: tx.method.startsWith('setSponsorForCollateral') ? 2 : 1, // 1-gas 2-storage
        value: parseInt(cfxCount),
        nonce,
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        contract,
        created_at: new Date(),
    };

    try {
        console.log(new Date(), 'Save sponsor log', meta.nonce);
        await SponsorLog.create(meta);
    } catch(e) {
        if (e.message !== 'Validation error') {
            console.log('Log create error', e);
        } else {
            console.log('Log already exist', e);
        }
        return false;
    }

    return true;
}

// get user first 100 txs, order by nonce desc
async function getUserTx(account, skip = 0, limit = 100) {
    let txs = [];
    // Get 'account' tx from Scan API
    let {list, total} = await _getUserTx(account, skip, limit);
    txs = txs.concat(list);
    // Get tx detail Info from RPC
    for(let i in txs) {
        let txInfo = await conflux.cfx.getTransactionByHash(txs[i].hash);
        txs[i].txInfo = txInfo;
        await wait(500); // 避免 rpc 请求频率过快
    }
    return txs;
}

// get all user txs, skip the first 'skip' txs
async function getAllUserTx(account, skip = 0, limit = 100, sort = 'DESC') {
    let txs = [];
    // Get 'account' tx from Scan API
    while (true) {
        let {list, total} = await _getUserTx(account, skip, limit, sort);
        txs = txs.concat(list);
        if (list.length < limit) break;
        skip += limit;
    }
    // Get tx detail Info from RPC
    for(let i in txs) {
        let txInfo = await conflux.cfx.getTransactionByHash(txs[i].hash);
        txs[i].txInfo = txInfo;
        await wait(500); // 避免 rpc 请求频率过快
    }
    return txs;
}

async function _getUserTx(account, skip, limit, sort = 'DESC') {
    const HOST = 'https://api.confluxscan.net';
    const { data } = await axios.get(`${HOST}/account/transactions?account=${account}&from=${account}&skip=${skip}&limit=${limit}&sort=${sort}`);
    return data.data;
}

function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}