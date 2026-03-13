export const API_URL = "https://script.google.com/macros/s/AKfycbzEvk_VbWIFs4sChKj9IAQcwbS-q1BdyfUM27zDiIEZ_d8Yw40bfyo4CkA8T7bfArl8lQ/exec";
export const CACHE_KEY = 'miniperfumes_catalog_cache_cbo';
export const CACHE_TTL = 1000 * 60 * 60; 

export let catalogData = [];
export let flatProducts = [];

export async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { redirect: "follow" });
            if (!response.ok) throw new Error("Error HTTP");
            return await response.text();
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(res => setTimeout(res, 1000 * (i + 1)));
        }
    }
}

export function processJsonData(data) {
    let processed = {}; flatProducts = []; 
    data.forEach(item => {
        if (!item.img || typeof item.img !== 'string' || item.img.trim() === '' || !item.img.startsWith('http')) return;

        let brand = item.brand || "Otras Marcas";
        if(!processed[brand]) processed[brand] = [];
        
        let finalImg = item.img; 
        let searchString = `${brand} ${item.name} ${item.cap}`.toLowerCase();
        let isPremium = searchString.includes('valentino') && searchString.includes('born in roma') && searchString.includes('15ml');
        
        // STOCK SIMULADO/REAL: Asignamos inventario bajo a algunos para urgencia
        let stock = item.stock !== undefined ? item.stock : Math.floor(Math.random() * 20) + 1; 

        const prodObj = { id: item.sku, name: item.name, cap: item.cap, img: finalImg, brand: brand, isPremium: isPremium, stock: stock };
        processed[brand].push(prodObj); flatProducts.push(prodObj); 
    });
    let finalArray = [];
    for (let brand in processed) if (processed[brand].length > 0) finalArray.push({ brand: brand, products: processed[brand] }); 
    catalogData = finalArray;
    return finalArray;
}

export async function loadCatalog() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) { 
                processJsonData(data);
                return true; 
            }
        }
        const rawText = await fetchWithRetry(API_URL);
        const data = JSON.parse(rawText);
        if (data.error) throw new Error("Fallo en Drive: " + data.error);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: data }));
        processJsonData(data);
        return true;
    } catch (error) {
        const oldCache = localStorage.getItem(CACHE_KEY);
        if (oldCache) { 
            processJsonData(JSON.parse(oldCache).data); 
            return true;
        } 
        return false;
    }
}

export function getProductById(id) { 
    return flatProducts.find(p => p.id === id) || null; 
}
