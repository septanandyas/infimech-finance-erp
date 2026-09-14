/**
 * migrate_utang_gaji.js
 * 
 * Migrasi sekali-jalan untuk:
 * 1. Menambahkan akun 2600 (Utang Gaji) ke ChartOfAccount
 * 2. Menambahkan kolom payment_journal_id & pph21_journal_id ke tabel payroll
 * 
 * Jalankan: node migrate_utang_gaji.js
 */

require('dotenv').config();
const db = require('./src/utils/db');

async function run() {
    try {
        console.log('=== Migrasi Utang Gaji ===\n');

        // 1. Tambah akun 2600 — Utang Gaji
        console.log('[1/3] Menambahkan akun 2600 ke ChartOfAccount...');
        await db.query(`
            INSERT IGNORE INTO ChartOfAccount (code, name, \`group\`, subgroup, description)
            VALUES (
                '2600',
                'Utang Gaji',
                'Kewajiban',
                'Kewajiban Jangka Pendek',
                'Gaji karyawan yang sudah menjadi beban tapi belum dibayarkan kepada karyawan'
            )
        `);
        console.log('   ✓ Akun 2600 (Utang Gaji) berhasil ditambahkan (atau sudah ada).\n');

        // 2. Pastikan akun 2300 ada (Utang PPh 21)
        console.log('[2/3] Memastikan akun 2300 (Utang PPh 21) tersedia...');
        await db.query(`
            INSERT IGNORE INTO ChartOfAccount (code, name, \`group\`, subgroup, description)
            VALUES (
                '2300',
                'Utang PPh 21',
                'Kewajiban',
                'Kewajiban Jangka Pendek',
                'Kewajiban PPh 21 yang dipotong dari gaji karyawan dan belum disetor ke DJP'
            )
        `);
        console.log('   ✓ Akun 2300 (Utang PPh 21) tersedia.\n');

        // 3. Tambah kolom payment_journal_id & pph21_journal_id ke tabel payroll
        console.log('[3/3] Menambahkan kolom payment_journal_id & pph21_journal_id ke tabel payroll...');

        const [cols] = await db.query(`SHOW COLUMNS FROM payroll LIKE 'payment_journal_id'`);
        if (cols.length === 0) {
            await db.query(`
                ALTER TABLE payroll
                ADD COLUMN payment_journal_id INT NULL DEFAULT NULL AFTER journal_id,
                ADD COLUMN pph21_journal_id INT NULL DEFAULT NULL AFTER payment_journal_id
            `);
            console.log('   ✓ Kolom payment_journal_id & pph21_journal_id berhasil ditambahkan.\n');
        } else {
            console.log('   ✓ Kolom sudah ada, tidak perlu ditambahkan.\n');
        }

        console.log('=== Migrasi selesai! ===');
        console.log('Selanjutnya restart server agar perubahan payroll.controller.js aktif.');

    } catch (err) {
        console.error('Migrasi gagal:', err);
    } finally {
        await db.end();
    }
}

run();
