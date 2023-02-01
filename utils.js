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

function currentMonth() {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1; 
    return `${year}-${padLeftZero(month)}-${padLeftZero(1)}`;
}

function lastMonth() {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1; 
    if (month === 1) {
        year = year - 1;
        month = 12;
    } else {
        month = month - 1;
    }
    return `${year}-${padLeftZero(month)}-${padLeftZero(1)}`;
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
    formatDate,
    currentMonth,
    lastMonth,
}