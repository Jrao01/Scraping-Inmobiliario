export const requireScraperKey = (req, res, next) => {
    const providedKey = req.headers['x-scraper-key'];

    if (!providedKey || providedKey !== process.env.SCRAPER_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};