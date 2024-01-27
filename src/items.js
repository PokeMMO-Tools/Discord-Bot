const { fetchItems } = require('./api');
const NodeCache = require('node-cache');
const cache = new NodeCache({
    stdTTL: 60 * 60 * 24, // 24 hours
    checkperiod: 60 * 60, // 1 hour
});

const getItems = async () => {
    const items = cache.get('items');
    if (items) {
        return items;
    }
    const newItems = await fetchItems();
    cache.set('items', newItems);
    return newItems;
}

module.exports = getItems;