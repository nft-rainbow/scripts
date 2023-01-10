const { stringify } = require('csv-stringify/sync');
const fs = require('fs');

function formatDateDime(date) {
    if (typeof date === "string") {
      date = new Date(date);
    }
    return `${date.getFullYear()}-${padLeftZero(date.getMonth() + 1)}-${padLeftZero(date.getDate())} ${padLeftZero(date.getHours())}:${padLeftZero(date.getMinutes())}:${padLeftZero(date.getSeconds())}`;
}

function formatDate(date) {
    if (typeof date === "string") {
      date = new Date(date);
    }
    return `${date.getFullYear()}-${padLeftZero(date.getMonth() + 1)}-${padLeftZero(date.getDate())}`;
}

function padLeftZero(num) {
    return num < 10 ? "0" + num : num;
}

function writeToCsv(fileName, items) {
    const csvStr = stringify(items, {header: true});
    fs.writeFileSync(fileName, '\uFEFF' + csvStr);  // https://blog.csdn.net/dkangel/article/details/119648796
}

module.exports = {
    formatDateDime,
    writeToCsv,
    formatDate
}