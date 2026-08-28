import { DataTypes } from "sequelize";
import sequelize from "../config/config.js";

const ScrapedProperty = sequelize.define(
    "ScrapedProperty",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        outer_source: {
            type: DataTypes.STRING,
            allowNull: false
        },
        source_url: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        external_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        listing_type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Alquiler"
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        price_type: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "monthly"
        },
        price_rate: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "paralelo"
        },
        owner_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        owner_photo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        owner_contact: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        neighborhood: {
            type: DataTypes.STRING,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true
        },
        zip_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lat: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        lng: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        bedrooms: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        bathrooms: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        area: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 0
        },
        furnished: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        features: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        main_image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        images: {
            type: DataTypes.TEXT,
            allowNull: true
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
        property_link_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "property_links",
                key: "id"
            }
        },
        created_at: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: sequelize.literal("(datetime('now'))")
        }
    },
    {
        tableName: "scraped_properties",
        timestamps: false
    }
);

export default ScrapedProperty;
