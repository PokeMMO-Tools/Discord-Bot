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
            fetch(`${BASE_URL}/items/${id}`),
            fetch(`${BASE_URL}/graph/items/${id}/min`),
            fetch(`${BASE_URL}/graph/items/${id}/quantity`),
        ]);
        
        // Log raw response status
        responses.forEach((response, index) => {
            const endpoint = index === 0 ? 'item' : index === 1 ? 'price' : 'quantity';
            console.log(`Response status for ${endpoint} endpoint:`, {
                status: response.status,
                ok: response.ok,
                url: response.url
            });
        });

        const [itemResponse, priceResponse, quantityResponse] = await Promise.all(responses.map(r => r.json()));
        
        console.log('API Responses:', {
            itemResponse,
            priceResponse,
            quantityResponse,
            itemResponseStructure: {
                hasData: 'data' in itemResponse,
                hasItemId: 'item_id' in itemResponse,
                type: typeof itemResponse
            }
        });

        // Get metadata from item_lookup.json
        const metadata = getItemMetadata(id);
        if (!metadata) {
            console.error('Metadata lookup failed:', {
                id,
                hasMetadata: !!metadata
            });
            throw new Error(`Item metadata not found for ID ${id}`);
        }
        
        // If item endpoint returns 404 but we have price/quantity data, use metadata instead
        if (itemResponse.status === 404) {
            console.log('Item endpoint returned 404, using metadata instead');
            return {
                item: {
                    ...metadata,
                    icon_url: metadata.icon_url || null
                },
                prices: priceResponse,
                quantities: quantityResponse
            };
        }
        
        // Validate item exists in API
        if (!itemResponse || typeof itemResponse !== 'object' || !('item_id' in itemResponse)) {
            console.error('Validation failed:', {
                itemResponseExists: !!itemResponse,
                isObject: typeof itemResponse === 'object',
                hasItemId: 'item_id' in itemResponse
            });
            throw new Error(`Item with ID ${id} not found in API`);
        }
        
        // Transform the data to match the expected structure
        const prices = priceResponse;
        const quantities = quantityResponse;

        console.log('Final data structure:', {
            item: {
                ...metadata,
                icon_url: itemResponse.icon_url
            },
            prices,
            quantities
        });

        return {
            item: {
                ...metadata,
                icon_url: itemResponse.icon_url
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
