/**
 * fix_journal_dates.js
 * Perbaiki journal_date semua jurnal payroll:
 *  - Jurnal PENGAKUAN (payroll_accrual) → pakai tanggal_dibuat (tanggal input dari HRD)
 *  - Jurnal PELUNASAN (payroll_payment)  → pakai tanggal_dibayar (tanggal bayar aktual)
 *  - Jurnal PPh 21   (payroll_pph21)     → pakai tanggal_dibayar (tanggal bayar aktual)
 * Jalankan: node fix_journal_dates.js
 */

const db = require('./src/utils/db');

const MONTH_NAMES = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
];

function parseMonthNumber(bulan) {
    if (!bulan) return new Date().getMonth() + 1;
    if (!isNaN(Number(bulan))) {
        const num = Number(bulan);
        if (num >= 1 && num <= 12) return num;
    }
    const idx = MONTH_NAMES.findIndex(m => m.toLowerCase() === String(bulan).toLowerCase().trim());
    return idx !== -1 ? idx + 1 : new Date().getMonth() + 1;
}

async function run() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Ambil semua payroll beserta id jurnal terkait
        const [payrolls] = await conn.query(`
            SELECT p.id, p.bulan, p.tahun, p.tanggal_dibuat, p.tanggal_dibayar,
                   p.journal_id, p.payment_journal_id, p.pph21_journal_id
            FROM payroll p
        `);

        let updatedAccrual = 0;
        let updatedPayment = 0;
        let updatedPph21   = 0;

        for (const p of payrolls) {
            const monthNum = parseMonthNumber(p.bulan);
            const yearNum  = Number(p.tahun) || new Date().getFullYear();

            // Tanggal PENGAKUAN = akhir bulan periode gaji
            const lastDay = new Date(yearNum, monthNum, 0).getDate();
            const accrualDate = `${yearNum}-${String(monthNum).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;



            // Tanggal dibayar → untuk jurnal pelunasan & PPh 21
            let payDate = null;
            if (p.tanggal_dibayar) {
                const d = new Date(p.tanggal_dibayar);
                payDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            }

            // Update JURNAL PENGAKUAN → tanggal input HRD
            if (p.journal_id) {
                const [exists] = await conn.query('SELECT id, journal_date FROM Journal WHERE id = ?', [p.journal_id]);
                if (exists.length > 0) {
                    const oldDate = exists[0].journal_date?.toISOString?.()?.slice(0, 10) || String(exists[0].journal_date).slice(0, 10);
                    if (oldDate !== accrualDate) {
                        await conn.query(
                            'UPDATE Journal SET journal_date = ?, period_month = ?, period_year = ? WHERE id = ?',
                            [accrualDate, monthNum, yearNum, p.journal_id]
                        );
                        console.log(`[ACCRUAL] Payroll #${p.id} (${p.bulan} ${p.tahun}): ${oldDate} → ${accrualDate}`);
                        updatedAccrual++;
                    }
                }
            }

            // Update JURNAL PELUNASAN → tanggal dibayar aktual
            if (p.payment_journal_id && payDate) {
                const [exists] = await conn.query('SELECT id, journal_date FROM Journal WHERE id = ?', [p.payment_journal_id]);
                if (exists.length > 0) {
                    const oldDate = exists[0].journal_date?.toISOString?.()?.slice(0, 10) || String(exists[0].journal_date).slice(0, 10);
                    if (oldDate !== payDate) {
                        await conn.query(
                            'UPDATE Journal SET journal_date = ?, period_month = ?, period_year = ? WHERE id = ?',
                            [payDate, monthNum, yearNum, p.payment_journal_id]
                        );
                        console.log(`[PAYMENT] Payroll #${p.id} (${p.bulan} ${p.tahun}): ${oldDate} → ${payDate}`);
                        updatedPayment++;
                    }
                }
            }

            // Update JURNAL PPh 21 → tanggal dibayar aktual
            if (p.pph21_journal_id && payDate) {
                const [exists] = await conn.query('SELECT id, journal_date FROM Journal WHERE id = ?', [p.pph21_journal_id]);
                if (exists.length > 0) {
                    const oldDate = exists[0].journal_date?.toISOString?.()?.slice(0, 10) || String(exists[0].journal_date).slice(0, 10);
                    if (oldDate !== payDate) {
                        await conn.query(
                            'UPDATE Journal SET journal_date = ?, period_month = ?, period_year = ? WHERE id = ?',
                            [payDate, monthNum, yearNum, p.pph21_journal_id]
                        );
                        console.log(`[PPH21]   Payroll #${p.id} (${p.bulan} ${p.tahun}): ${oldDate} → ${payDate}`);
                        updatedPph21++;
                    }
                }
            }
        }

        await conn.commit();
        console.log('\n✅ Selesai!');
        console.log(`   Jurnal Pengakuan diupdate : ${updatedAccrual}`);
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
