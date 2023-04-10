const { Conflux } = require('js-conflux-sdk');

const conflux = new Conflux({
    url: 'https://main.confluxrpc.com',
    networkId: 1029,
});

module.exports = {
    conflux,
}