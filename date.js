function getDate() {
    const today = new Date();
    const options = {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    };
    return today.toLocaleDateString("en-US", options);
}

module.exports = {
    getDate: getDate
};