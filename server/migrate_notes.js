require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const url = new URL(process.env.DATABASE_URL);
    const conn = await mysql.createConnection({
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\/+/, ''),
        ssl: { rejectUnauthorized: false },
    });

    // Cek apakah tabel sudah ada
    const [tables] = await conn.execute(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Notes'`,
        [url.pathname.replace(/^\/+/, '')]
    );

    if (tables.length > 0) {
        console.log('ℹ️  Tabel Notes sudah ada, tidak perlu dibuat ulang.');
        await conn.end();
        console.log('✅ Selesai!');
        return;
    }

    const sql = `
        CREATE TABLE Notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            judul VARCHAR(255) NOT NULL,
            isi TEXT NOT NULL,
            kategori ENUM('Masalah', 'Temuan', 'Ide', 'Lainnya') NOT NULL DEFAULT 'Lainnya',
            createdBy INT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_notes_kategori (kategori),
            INDEX idx_notes_createdBy (createdBy),
            INDEX idx_notes_createdAt (createdAt),
            CONSTRAINT fk_notes_user FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await conn.execute(sql);
    console.log('✅ Tabel Notes berhasil dibuat (atau sudah ada)');

    await conn.end();
    console.log('✅ Migrasi selesai!');
}

migrate().catch(err => {
    console.error('❌ Migrasi gagal:', err.message);
    process.exit(1);
});
