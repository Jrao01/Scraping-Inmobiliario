import { DataTypes } from "sequelize";
import sequelize from "../config/config.js";

const PropertyLink = sequelize.define(
    "PropertyLink",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        link: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        source: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "rentahouse"
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending"
        },
        created_at: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: sequelize.literal("(datetime('now'))")
        },
        updated_at: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: sequelize.literal("(datetime('now'))")
        },
        scraped_at: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        }
    },
    {
        tableName: "property_links",
        timestamps: false
    }
);

export default PropertyLink;
