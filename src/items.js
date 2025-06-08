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
};

// Find item by ID
const findItemById = async (id) => {
    const items = await getItems();
    return items.find(item => item.id === parseInt(id));
};

// Find item by name (case-insensitive)
const findItemByName = async (name) => {
    const items = await getItems();
    return items.find(item => item.name.toLowerCase() === name.toLowerCase());
};

// Find item by name with partial match (for autocomplete)
const findItemsByName = async (name) => {
    const items = await getItems();
    const searchTerm = name.toLowerCase();
    return items.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
};

module.exports = {
    getItems,
    findItemById,
    findItemByName,
    findItemsByName
};