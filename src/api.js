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
        console.log(`Fetching data for item ID: ${id}`);
        const responses = await Promise.all([
            fetch(`${BASE_URL}/graph/items/${id}/min`),
            fetch(`${BASE_URL}/graph/items/${id}/quantity`),
        ]);

        // Get metadata from item_lookup.json
        const metadata = getItemMetadata(id);
        if (!metadata) {
            console.error('Metadata lookup failed:', {
                id,
                hasMetadata: !!metadata
            });
            throw new Error(`Item metadata not found for ID ${id}`);
        }

        // Get price and quantity data
        const [priceResponse, quantityResponse] = await Promise.all(responses.map(r => r.json()));

        // Return the data using metadata
        return {
            item: {
                ...metadata,
                icon_url: metadata.icon_url || null
            },
            prices: priceResponse,
            quantities: quantityResponse
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
