import sequelize from "../config/config.js";
import ScrapedProperty from "./scraped_properties.js";
import ScrapingRun from "./scraping_runs.js";
import PropertyLink from "./property_links.js";

const models = { ScrapedProperty, ScrapingRun, PropertyLink };

// Relaciones
PropertyLink.hasOne(ScrapedProperty, {
    foreignKey: "property_link_id",
    as: "scrapedProperty"
});

ScrapedProperty.belongsTo(PropertyLink, {
    foreignKey: "property_link_id",
    as: "propertyLink"
});

const syncDatabase = async (options = {}) => {
    try {
        await sequelize.authenticate();
        await sequelize.sync(options);
        console.log("Base de datos SQLite sincronizada. Tablas:",
            Object.values(models).map((m) => m.getTableName()).join(", "));
    } catch (error) {
        console.error("Error al sincronizar la base de datos:", error);
    }
};

export { sequelize, ScrapedProperty, ScrapingRun, PropertyLink, syncDatabase };
export default models;
