const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const sleep = promisify(setTimeout);

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_TTL = 3600000; // 1 hour

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function getCacheKey(id) {
    const cacheFile = path.join(CACHE_DIR, `${id}.json`);
    if (!fs.existsSync(cacheFile)) return null;
    
    const stats = fs.statSync(cacheFile);
    const age = Date.now() - stats.mtimeMs;
    
    // If cache is too old, delete it and return null
    if (age > CACHE_TTL) {
        fs.unlinkSync(cacheFile);
        return null;
    }
    
    return cacheFile;
}

async function cacheData(id, data) {
    const cacheFile = path.join(CACHE_DIR, `${id}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(data));
}

async function fetchWithCache(url, id) {
    try {
        const cacheFile = await getCacheKey(id);
        if (cacheFile) {
            console.log(`Cache hit for ${id}`);
            return JSON.parse(fs.readFileSync(cacheFile));
        }
        
        console.log(`Cache miss for ${id}, fetching from API`);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`API error for ${id}: ${response.status}`);
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        await cacheData(id, data);
        return data;
    } catch (error) {
        console.error(`Error fetching data for ${id}:`, error);
        throw error;
    }
}

module.exports = {
    fetchWithCache,
    CACHE_TTL
};
