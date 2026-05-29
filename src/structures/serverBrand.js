const _brandCache = new Map();
const BRAND_TTL = 5 * 60 * 1000;

async function getServerBrand(client, guildId) {
    const cached = _brandCache.get(guildId);
    if (cached && Date.now() < cached.expires) return cached.brand;
    const brand = await client.data4.get(`server_brand_${guildId}`) || {};
    _brandCache.set(guildId, { brand, expires: Date.now() + BRAND_TTL });
    return brand;
}

function invalidateServerBrandCache(guildId) {
    _brandCache.delete(guildId);
}

module.exports = { getServerBrand, invalidateServerBrandCache };
