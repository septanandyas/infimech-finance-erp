/**
 * fix_cashflow_dates.js
 * Perbaiki tanggal (date) di tabel Cashflow untuk payroll:
 *  - Gunakan tanggal_dibayar aktual dari tabel payroll
 *  - Jika tanggal_dibayar NULL, gunakan tanggal_dibuat
 * Jalankan: node fix_cashflow_dates.js
 */

const db = require('./src/utils/db');

async function run() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Ambil semua payroll yang punya cashflow_id
        const [payrolls] = await conn.query(`
            SELECT p.id, p.bulan, p.tahun, p.tanggal_dibuat, p.tanggal_dibayar,
                   p.cashflow_id, c.date as cashflow_date
            FROM payroll p
            JOIN Cashflow c ON p.cashflow_id = c.id
        `);

        let updated = 0;

        for (const p of payrolls) {
            // Tentukan tanggal yang benar untuk cashflow:
            // Prioritas: tanggal_dibayar → tanggal_dibuat
            let correctDate;
            if (p.tanggal_dibayar) {
                const d = new Date(p.tanggal_dibayar);
                correctDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            } else if (p.tanggal_dibuat) {
                const d = new Date(p.tanggal_dibuat);
                correctDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            } else {
                continue;
            }

            const currentDate = p.cashflow_date instanceof Date
                ? p.cashflow_date.toISOString().slice(0, 10)
                : String(p.cashflow_date).slice(0, 10);

            if (currentDate !== correctDate) {
                await conn.query(
                    'UPDATE Cashflow SET date = ? WHERE id = ?',
                    [correctDate, p.cashflow_id]
                );
                console.log(`[CASHFLOW] Payroll #${p.id} (${p.bulan} ${p.tahun}): ${currentDate} → ${correctDate}`);
                updated++;
            }
        }

        await conn.commit();
        console.log(`\n✅ Selesai! Cashflow diupdate: ${updated}`);
    } catch (err) {
        await conn.rollback();
        console.error('❌ Error:', err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
