import axios from "axios";
export const client = axios.create({
    timeout: 20000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-VE,es;q=0.9,en;q=0.8',
    },
    maxRedirects: 5,
});

export const fetchPageWithRetry = async (url, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const {
                data: htmlString
            } = await client.get(url);
            return htmlString;
        } catch (err) {
            console.error(`[Property] Error en intento ${attempt}/${retries} para ${url}: ${err.message}`);
            if (attempt < retries) {
                const backoff = attempt * 2000;
                console.log(`[Property] Reintentando en ${backoff}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            } else {
                throw err;
            }
        }
    }
};