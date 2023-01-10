function formatDate(date) {
    if (typeof date === "string") {
      date = new Date(date);
    }
    return `${date.getFullYear()}-${padLeftZero(date.getMonth() + 1)}-${padLeftZero(date.getDate())} ${padLeftZero(date.getHours())}:${padLeftZero(date.getMinutes())}:${padLeftZero(date.getSeconds())}`;
}

function padLeftZero(num) {
    return num < 10 ? "0" + num : num;
}

module.exports = {
    formatDate
}