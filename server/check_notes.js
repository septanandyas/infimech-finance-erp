require('dotenv').config();
const mysql = require('mysql2/promise');
async function check() {
    const url = new URL(process.env.DATABASE_URL);
    const conn = await mysql.createConnection({
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\/+/, ''),
        ssl: { rejectUnauthorized: false }
    });
    const [rows] = await conn.query("SHOW TABLES LIKE 'Notes'");
    console.log('Tabel Notes ada:', rows.length > 0 ? 'YA' : 'TIDAK');
    if (rows.length > 0) {
        const [cols] = await conn.execute('DESCRIBE Notes');
        console.log('Kolom:', cols.map(c => c.Field).join(', '));
    }
    await conn.end();
}
check().catch(e => console.error('Error:', e.message));
