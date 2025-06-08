const fetch = require('node-fetch');
const itemLookup = require('./item_lookup.json');

const BASE_URL = 'https://apis.fiereu.de/pokemmoprices/v1';

function getItemMetadata(id) {
    const item = itemLookup[id];
    if (!item) return null;
    return {
        id: parseInt(id),
        name: item.name.en,
        description: item.description.en,
    };
}

async function fetchItemData(id) {
    try {
        const responses = await Promise.all([
            fetch(`${BASE_URL}/items/${id}`),
            fetch(`${BASE_URL}/graph/items/${id}/min`),
            fetch(`${BASE_URL}/graph/items/${id}/quantity`),
        ]);
        const [itemResponse, priceResponse, quantityResponse] = await Promise.all(responses.map(r => r.json()));
        
        // Validate item exists in API
        if (!itemResponse || typeof itemResponse !== 'object' || !('item_id' in itemResponse)) {
            throw new Error(`Item with ID ${id} not found in API`);
        }
        
        // Get metadata from item_lookup.json
        const metadata = getItemMetadata(id);
        if (!metadata) {
            throw new Error(`Item metadata not found for ID ${id}`);
        }
        
        // Transform the data to match the expected structure
        const prices = priceResponse;
        const quantities = quantityResponse;

        return {
            item: {
                ...metadata,
                icon_url: itemResponse.data.icon_url
            },
            prices,
            quantities
        };
    } catch (err) {
        console.error('Error fetching item data:', err);
        throw err; // Re-throw error to be handled by caller
    }
}

async function fetchItems() {
    try {
        const response = await fetch(`${BASE_URL}/items`);
        const items = await response.json();
        
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
