/**
 * fix_payment_journal_period.js
 * Perbaiki period_month & period_year jurnal pelunasan (payroll_payment) dan PPh21 (payroll_pph21)
 * agar sesuai dengan BULAN SAAT DIBAYAR (tanggal_dibayar), bukan bulan periode gaji.
 * Jalankan: node fix_payment_journal_period.js
 */

const db = require('./src/utils/db');

async function run() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [payrolls] = await conn.query(`
            SELECT p.id, p.bulan, p.tahun, p.tanggal_dibayar,
                   p.payment_journal_id, p.pph21_journal_id
            FROM payroll p
            WHERE p.payment_journal_id IS NOT NULL OR p.pph21_journal_id IS NOT NULL
        `);

        let updatedPayment = 0;
        let updatedPph21   = 0;

        for (const p of payrolls) {
            if (!p.tanggal_dibayar) continue;

            const d = new Date(p.tanggal_dibayar);
            const payMonth = d.getMonth() + 1;
            const payYear  = d.getFullYear();

            // Update jurnal PELUNASAN → period = bulan dibayar
            if (p.payment_journal_id) {
                const [jRows] = await conn.query(
                    'SELECT id, period_month, period_year FROM Journal WHERE id = ?',
                    [p.payment_journal_id]
                );
                if (jRows.length > 0) {
                    const j = jRows[0];
                    if (j.period_month !== payMonth || j.period_year !== payYear) {
                        await conn.query(
                            'UPDATE Journal SET period_month = ?, period_year = ? WHERE id = ?',
                            [payMonth, payYear, p.payment_journal_id]
                        );
                        console.log(`[PAYMENT] Payroll #${p.id} (${p.bulan} ${p.tahun}): period ${j.period_month}/${j.period_year} → ${payMonth}/${payYear}`);
                        updatedPayment++;
                    }
                }
            }

            // Update jurnal PPh21 → period = bulan dibayar
            if (p.pph21_journal_id) {
                const [jRows] = await conn.query(
                    'SELECT id, period_month, period_year FROM Journal WHERE id = ?',
                    [p.pph21_journal_id]
                );
                if (jRows.length > 0) {
                    const j = jRows[0];
                    if (j.period_month !== payMonth || j.period_year !== payYear) {
                        await conn.query(
                            'UPDATE Journal SET period_month = ?, period_year = ? WHERE id = ?',
                            [payMonth, payYear, p.pph21_journal_id]
                        );
                        console.log(`[PPH21]   Payroll #${p.id} (${p.bulan} ${p.tahun}): period ${j.period_month}/${j.period_year} → ${payMonth}/${payYear}`);
                        updatedPph21++;
                    }
                }
            }
        }

        await conn.commit();
        console.log(`\n✅ Selesai!`);
        console.log(`   Jurnal Pelunasan diupdate : ${updatedPayment}`);
        console.log(`   Jurnal PPh 21 diupdate    : ${updatedPph21}`);
    } catch (err) {
        await conn.rollback();
        console.error('❌ Error:', err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
