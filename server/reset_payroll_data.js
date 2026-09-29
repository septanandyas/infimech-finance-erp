/**
 * reset_payroll_data.js
 * Hapus SEMUA data payroll: slip gaji, jurnal, cashflow gaji
 * Jalankan: node reset_payroll_data.js
 */

const db = require('./src/utils/db');

async function run() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Ambil semua journal_id terkait payroll
        const [journals] = await conn.query(`
            SELECT id FROM Journal 
            WHERE type IN ('payroll_accrual', 'payroll_payment', 'payroll_pph21', 'payroll')
        `);
        const journalIds = journals.map(j => j.id);

        // 2. Hapus JournalEntry
        let deletedEntries = 0;
        if (journalIds.length > 0) {
            const [r] = await conn.query(
                `DELETE FROM JournalEntry WHERE journalId IN (${journalIds.map(() => '?').join(',')})`,
                journalIds
            );
            deletedEntries = r.affectedRows;
        }

        // 3. Hapus Journal
        const [r2] = await conn.query(`
            DELETE FROM Journal 
            WHERE type IN ('payroll_accrual', 'payroll_payment', 'payroll_pph21', 'payroll')
        `);

        // 4. Hapus Cashflow payroll
        const [r3] = await conn.query(`DELETE FROM Cashflow WHERE source = 'payroll'`);

        // 5. Hapus semua slip gaji
        const [r4] = await conn.query(`DELETE FROM payroll`);

        await conn.commit();

        console.log('✅ Berhasil hapus semua data payroll:');
        console.log(`   JournalEntry dihapus : ${deletedEntries}`);
        console.log(`   Journal dihapus      : ${r2.affectedRows}`);
        console.log(`   Cashflow dihapus     : ${r3.affectedRows}`);
        console.log(`   Slip gaji dihapus    : ${r4.affectedRows}`);

    } catch (err) {
        await conn.rollback();
        console.error('❌ Error:', err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
