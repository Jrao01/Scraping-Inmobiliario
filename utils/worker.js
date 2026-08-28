import launchBrowser from "puppeteer-stealth-launcher";
import {
    fileURLToPath
} from 'url';
import puppeteer from "puppeteer";
import fs from 'fs';
import path from 'path';

const currentFilePath = fileURLToPath(
    import.meta.url);

const LOG_FILE = path.join(process.cwd(), 'requests.log');

function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf8');
}

let browserInstance = null;

async function getBrowserInstance() {
    if (browserInstance === null) {
        browserInstance = await launchBrowser({
            headless: false,
            hide: false,
            //executablePath: puppeteer.executablePath(),
            defaultViewport: {
                width: 1090,
                height: 820
            },
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ],
        });
    }
    return browserInstance;
}


async function getPageInstance(browser, url) {

    const page = await browser.newPage();
    logToFile('=== NUEVA PAGINA ===');
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const reqUrl = request.url();
        const method = request.method();
        const resourceType = request.resourceType();

        if (method === 'GET') {
            logToFile(`[REQUEST GET] ${resourceType} -> ${reqUrl}`);
        }

        if (resourceType === 'font' || resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'media') {
            request.abort()
        } else {
            request.continue()
        }
    });

    page.on('response', async (response) => {
        const resUrl = response.url();
        const method = response.request().method();
        const contentType = response.headers()['content-type'] || '';

        if (method === 'GET' && contentType.includes('application/json')) {
            try {
                const text = await response.text();
                logToFile(`[RESPONSE JSON] ${resUrl}`);
                logToFile(`[RESPONSE BODY] ${text.substring(0, 2000)}`);
            } catch (e) {
                logToFile(`[RESPONSE JSON] ${resUrl} (no se pudo leer body: ${e.message})`);
            }
        }
    });
    await page.goto(url, {
        waitUntil: "domcontentloaded"
    });
return page;
}


const isMain = currentFilePath === process.argv[1];

if (isMain) {
    getBrowserInstance()
}

export { getBrowserInstance, getPageInstance };
