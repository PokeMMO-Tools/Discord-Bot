const fetch = require('node-fetch');

const BASE_URL = process.env.API_BASE_URL;

module.exports = {
    fetchItemData: async (id) => {
        try {
            const responses = await Promise.all([
                fetch(`${BASE_URL}/items/${id}`),
                fetch(`${BASE_URL}/items/graph/min/${id}/14`), // only get the last 14 days of data
                fetch(`${BASE_URL}/items/graph/quantity/${id}`),
            ]);
            const [itemResponse, priceResponse, quantityResponse] = await Promise.all(responses.map(r => r.json()));
            return {
                item: itemResponse["data"],
                prices: priceResponse["data"],
                quantities: quantityResponse["data"],
            }
        } catch (err) {
            console.error(err);
            return {
                item: null,
                prices: null,
                quantities: null,
            }
        }
    },
    fetchItems: async () => {
        try {
            const response = await fetch(`${BASE_URL}/items/all?noDescription=true`);
            const items = await response.json();
            return items["data"];
        } catch (err) {
            console.error(err);
            return [];
        }
    },
}