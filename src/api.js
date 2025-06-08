const fetch = require('node-fetch');
const itemLookup = require('./item_lookup.json');
const { fetchWithCache } = require('./cache');

const BASE_URL = 'https://apis.fiereu.de/pokemmoprices/v1';

function getItemMetadata(id) {
    const item = itemLookup[id];
    if (!item) return null;
    return {
        id: parseInt(id),
        name: item.name,
        description: item.description.en,
    };
}

const TIME_WINDOW_DAYS = 14;

async function fetchItemData(id, timeWindowDays = TIME_WINDOW_DAYS) {
    try {
        console.log(`Fetching data for item ID: ${id} with ${timeWindowDays} day window`);

        // Get metadata from item_lookup.json
        const metadata = getItemMetadata(id);
        if (!metadata) {
            console.error('Metadata lookup failed:', {
                id,
                hasMetadata: !!metadata
            });
            throw new Error(`Item metadata not found for ID ${id}`);
        }

        // Calculate timestamp for start of time window
        const startTime = Math.floor(Date.now() / 1000) - (timeWindowDays * 24 * 60 * 60);

        // Fetch price and quantity data with caching
        const [prices, quantities] = await Promise.all([
            fetchWithCache(`${BASE_URL}/graph/items/${id}/min?start=${startTime}`, `price_${id}_${startTime}`),
            fetchWithCache(`${BASE_URL}/graph/items/${id}/quantity?start=${startTime}`, `quantity_${id}_${startTime}`)
        ]);

        // Filter data to only include points within our time window
        const filteredPrices = prices.filter(point => point.x >= startTime);
        const filteredQuantities = quantities.filter(point => point.x >= startTime);

        // Return the data using metadata
        return {
            item: {
                ...metadata,
                icon_url: metadata.icon_url || null
            },
            prices: filteredPrices,
            quantities: filteredQuantities
        };
    } catch (err) {
        console.error('Error fetching item data:', err);
        throw err; // Re-throw error to be handled by caller
    }
}

async function fetchItems() {
    try {
        const items = await fetchWithCache(`${BASE_URL}/items`, 'items_list');

        // Map API items to include metadata from item_lookup.json
        // Only include items that exist in both API and item_lookup
        return items.filter(apiItem => {
            const metadata = getItemMetadata(apiItem.item_id);
            return metadata !== null;
        }).map(apiItem => {
            const metadata = getItemMetadata(apiItem.item_id);
            return {
                id: apiItem.item_id,
                name: metadata?.name || apiItem.name,
                icon_url: apiItem.icon_url
            };
        });

        // Map API items to include metadata from item_lookup.json
        // Only include items that exist in both API and item_lookup
        return items.filter(apiItem => {
            const metadata = getItemMetadata(apiItem.item_id);
            return metadata !== null;
        }).map(apiItem => {
            const metadata = getItemMetadata(apiItem.item_id);
            return {
                id: apiItem.item_id,
                name: metadata?.name || apiItem.name,
                icon_url: apiItem.icon_url
            };
        });
    } catch (err) {
        console.error('Error fetching items:', err);
        throw err; // Re-throw error to be handled by caller
    }
}

async function validateItemId(id) {
    try {
        const response = await fetch(`${BASE_URL}/items/${id}`);
        const data = await response.json();
        // Check if we got valid item data
        return !!data && typeof data === 'object' && 'item_id' in data;
    } catch (err) {
        console.error(`Error validating item ID ${id}:`, err);
        return false;
    }
}

module.exports = {
    getItemMetadata,
    fetchItemData,
    fetchItems,
    validateItemId
};
