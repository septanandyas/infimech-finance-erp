const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const buildPoolConfig = () => {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host: url.hostname,
            port: Number(url.port || 3306),
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\/+/, ''),
            connectionLimit: 10,
            ssl: { rejectUnauthorized: false },
            timezone: 'Z'
        };
    }

    return {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 10,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        timezone: 'Z'
    };
};

const pool = mysql.createPool(buildPoolConfig());
module.exports = pool;