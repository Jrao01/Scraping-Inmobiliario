import { DataTypes } from "sequelize";
import sequelize from "../config/config.js";

const ScrapingRun = sequelize.define(
    "ScrapingRun",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        source_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        started_at: {
            type: DataTypes.STRING,
            allowNull: false
        },
        finished_at: {
            type: DataTypes.STRING,
            allowNull: true
        },
        items_found: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        items_ok: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        items_error: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        }
    },
    {
        tableName: "scraping_runs",
        timestamps: false
    }
);

export default ScrapingRun;
