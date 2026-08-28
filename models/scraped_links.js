import { DataTypes } from "sequelize";
import sequelize from "../config/config.js";

const ScrapedLink = sequelize.define(
    "ScrapedLink",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        outer_source: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "rentahouse"
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        listing_type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Alquiler"
        },
        scraped_at: {
            type: DataTypes.STRING,
            allowNull: false
        },
        synced_at: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        created_at: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: sequelize.literal("(datetime('now'))")
        }
    },
    {
        tableName: "scraped_Links",
        timestamps: false
    }
);

export default ScrapedLink;
