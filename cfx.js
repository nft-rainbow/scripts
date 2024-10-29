const { Conflux } = require('js-conflux-sdk');
const config = require('./config.json');

const conflux = new Conflux({
    url: config.rpc,
    networkId: 1029,
});

module.exports = {
    conflux,
}