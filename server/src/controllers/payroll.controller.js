const db = require('../utils/db');

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const parseMonthNumber = (bulan) => {
    if (!bulan) return new Date().getMonth() + 1;
    if (!isNaN(Number(bulan))) {
        const num = Number(bulan);
        if (num >= 1 && num <= 12) return num;
    }
    const idx = MONTH_NAMES.findIndex(m => m.toLowerCase() === String(bulan).toLowerCase().trim());
    return idx !== -1 ? idx + 1 : new Date().getMonth() + 1;
};

const getMonthName = (monthNum) => {
    const idx = Number(monthNum) - 1;
    return MONTH_NAMES[idx] || MONTH_NAMES[new Date().getMonth()];
};

/**
 * Helper to generate or update journal & cashflow for a single payroll record
 */
const syncJournalForPayroll = async (conn, payrollId) => {
    const [rows] = await conn.query(`
        SELECT p.*, k.nama as nama_karyawan, k.nik as nik_karyawan, k.jabatan
        FROM payroll p
        LEFT JOIN karyawan k ON p.karyawan_id = k.id
        WHERE p.id = ?
    `, [payrollId]);

    if (!rows || rows.length === 0) return null;
    const p = rows[0];

    const isPaid = ['Dibayar', 'Sudah Dibayar'].includes(p.status_pembayaran);
    if (!isPaid) {
        // If not paid, remove existing journal & cashflow if any
        if (p.journal_id) {
            await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [p.journal_id]);
            await conn.query('DELETE FROM Journal WHERE id = ?', [p.journal_id]);
        }
        if (p.cashflow_id) {
            await conn.query('DELETE FROM Cashflow WHERE id = ?', [p.cashflow_id]);
        }
        await conn.query('UPDATE payroll SET journal_id = NULL, cashflow_id = NULL WHERE id = ?', [payrollId]);
        return null;
    }

    const monthNum = parseMonthNumber(p.bulan);
    const monthStr = getMonthName(monthNum);
    const yearNum = Number(p.tahun) || new Date().getFullYear();
    const empName = p.nama_karyawan || 'Karyawan';

    const gajiPokok = Number(p.gaji_pokok || 0);
    const tunjangan = Number(p.tunjangan || 0);
    const bonus = Number(p.bonus || 0);
    const potongan = Number(p.potongan || 0);
    const pph21 = p.pph21_type === 'custom' ? Number(p.pph21 || 0) : 0;

    const bebanGaji = Math.max(0, gajiPokok + tunjangan + bonus - potongan);
    const gajiBersih = Math.max(0, bebanGaji - pph21);

    const payDate = p.tanggal_dibayar
        ? (p.tanggal_dibayar.toISOString?.()?.slice(0, 10) || p.tanggal_dibayar)
        : `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;

    const ref = `PAY-${yearNum}${String(monthNum).padStart(2, '0')}-${String(p.id).padStart(3, '0')}`;
    const desc = `Beban Gaji - ${empName} (${monthStr} ${yearNum})`;

    // 1. Manage Journal
    let journalId = p.journal_id;
    if (!journalId) {
        const [byRef] = await conn.query(
            `SELECT id FROM Journal WHERE reference = ? AND type = 'payroll'`,
            [ref]
        );
        if (byRef.length > 0) {
            journalId = byRef[0].id;
        }
    }

    if (journalId) {
        const [jExists] = await conn.query('SELECT id FROM Journal WHERE id = ?', [journalId]);
        if (jExists.length > 0) {
            await conn.query(`
                UPDATE Journal
                SET journal_date = ?, description = ?, reference = ?, type = 'payroll', period_month = ?, period_year = ?
                WHERE id = ?
            `, [payDate, desc, ref, monthNum, yearNum, journalId]);
            await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [journalId]);
        } else {
            journalId = null;
        }
    }

    if (!journalId) {
        const [jRes] = await conn.query(`
            INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
            VALUES (?, ?, ?, 'payroll', ?, ?, NOW())
        `, [payDate, desc, ref, monthNum, yearNum]);
        journalId = jRes.insertId;
    }

    // Insert JournalEntry rows (Balanced double-entry)
    // Line 1: Debit 5100 Gaji Karyawan (Beban / HPP)
    await conn.query(`
        INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
        VALUES (?, '5100', ?, ?, 0)
    `, [journalId, desc, bebanGaji]);

    // Line 2: Credit 1100 Kas (Gaji Bersih)
    await conn.query(`
        INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
        VALUES (?, '1100', ?, 0, ?)
    `, [journalId, `Kas Keluar Gaji - ${empName}`, gajiBersih]);

    // Line 3: Credit 2300 Utang PPh 21 (Nominal PPh 21) if any
    if (pph21 > 0) {
        await conn.query(`
            INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
            VALUES (?, '2300', ?, 0, ?)
        `, [journalId, `Utang PPh 21 - ${empName}`, pph21]);
    }

    // 2. Manage Cashflow (for cash tracking in Cashflow module)
    let cashflowId = p.cashflow_id;
    if (!cashflowId) {
        const [byDesc] = await conn.query(
            `SELECT id FROM Cashflow WHERE source = 'payroll' AND description = ? AND date = ?`,
            [`Pembayaran Gaji - ${empName} (${monthStr} ${yearNum})`, payDate]
        );
        if (byDesc.length > 0) {
            cashflowId = byDesc[0].id;
        }
    }

    if (cashflowId) {
        const [cfExists] = await conn.query('SELECT id FROM Cashflow WHERE id = ?', [cashflowId]);
        if (cfExists.length > 0) {
            await conn.query(`
                UPDATE Cashflow
                SET type = 'expense', category = 'Gaji', amount = ?, description = ?, date = ?, coa_code = '1100', source = 'payroll', updatedAt = NOW()
                WHERE id = ?
            `, [gajiBersih, `Pembayaran Gaji - ${empName} (${monthStr} ${yearNum})`, payDate, cashflowId]);
        } else {
            cashflowId = null;
        }
    }

    if (!cashflowId) {
        const [cfRes] = await conn.query(`
            INSERT INTO Cashflow (type, category, amount, description, date, coa_code, source, createdBy, createdAt, updatedAt)
            VALUES ('expense', 'Gaji', ?, ?, ?, '1100', 'payroll', 2, NOW(), NOW())
        `, [gajiBersih, `Pembayaran Gaji - ${empName} (${monthStr} ${yearNum})`, payDate]);
        cashflowId = cfRes.insertId;
    }

    // 3. Update payroll reference
    await conn.query(`
        UPDATE payroll
        SET journal_id = ?, cashflow_id = ?, total_gaji = ?
        WHERE id = ?
    `, [journalId, cashflowId, gajiBersih, payrollId]);

    return { journalId, cashflowId, bebanGaji, gajiBersih, pph21 };
};

/**
 * Auto-sync missing or unaligned journals for all paid payroll slips
 */
const autoSyncPayrollJournals = async () => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [allPaid] = await conn.query(`
            SELECT id FROM payroll
            WHERE status_pembayaran IN ('Dibayar', 'Sudah Dibayar')
        `);

        for (const row of allPaid) {
            await syncJournalForPayroll(conn, row.id);
        }
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        console.error('autoSyncPayrollJournals error:', err);
    } finally {
        conn.release();
    }
};

const getPayrolls = async (req, res) => {
    try {
        await autoSyncPayrollJournals();

        const { month, year, karyawan_id, search } = req.query;
        let sql = `
            SELECT p.*,
                   k.nama as nama_karyawan,
                   k.nik as nik_karyawan,
                   k.jabatan,
                   d.nama_departemen as departemen,
                   j.reference as journal_ref
            FROM payroll p
            LEFT JOIN karyawan k ON p.karyawan_id = k.id
            LEFT JOIN departemen d ON k.departemen_id = d.id
            LEFT JOIN Journal j ON p.journal_id = j.id
            WHERE 1=1
        `;
        const params = [];

        if (month) {
            const mNum = parseMonthNumber(month);
            const mStr = getMonthName(mNum);
            sql += ` AND (p.bulan = ? OR p.bulan = ? OR p.bulan = ?)`;
            params.push(String(month), String(mNum), mStr);
        }

        if (year) {
            sql += ` AND p.tahun = ?`;
            params.push(Number(year));
        }

        if (karyawan_id) {
            sql += ` AND p.karyawan_id = ?`;
            params.push(Number(karyawan_id));
        }

        if (search) {
            sql += ` AND (k.nama LIKE ? OR k.nik LIKE ? OR k.jabatan LIKE ?)`;
            const q = `%${search}%`;
            params.push(q, q, q);
        }

        sql += ` ORDER BY p.tahun DESC, p.id DESC`;

        const [rows] = await db.query(sql, params);

        const mapped = rows.map(r => {
            const gajiPokok = Number(r.gaji_pokok || 0);
            const tunjangan = Number(r.tunjangan || 0);
            const bonus = Number(r.bonus || 0);
            const potongan = Number(r.potongan || 0);
            const pph21 = r.pph21_type === 'custom' ? Number(r.pph21 || 0) : 0;
            const gajiKotor = gajiPokok + tunjangan + bonus - potongan;
            const gajiBersih = gajiKotor - pph21;

            return {
                ...r,
                gaji_kotor: gajiKotor,
                gaji_bersih: gajiBersih,
                bulan_nama: getMonthName(parseMonthNumber(r.bulan))
            };
        });

        res.json(mapped);
    } catch (error) {
        console.error('getPayrolls error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getPayrollById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT p.*,
                   k.nama as nama_karyawan,
                   k.nik as nik_karyawan,
                   k.jabatan,
                   d.nama_departemen as departemen,
                   j.reference as journal_ref
            FROM payroll p
            LEFT JOIN karyawan k ON p.karyawan_id = k.id
            LEFT JOIN departemen d ON k.departemen_id = d.id
            LEFT JOIN Journal j ON p.journal_id = j.id
            WHERE p.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Slip gaji tidak ditemukan' });
        }

        const r = rows[0];
        const gajiPokok = Number(r.gaji_pokok || 0);
        const tunjangan = Number(r.tunjangan || 0);
        const bonus = Number(r.bonus || 0);
        const potongan = Number(r.potongan || 0);
        const pph21 = r.pph21_type === 'custom' ? Number(r.pph21 || 0) : 0;
        const gajiKotor = gajiPokok + tunjangan + bonus - potongan;
        const gajiBersih = gajiKotor - pph21;

        // Fetch journal entries if available
        let entries = [];
        if (r.journal_id) {
            const [jeRows] = await db.query(`
                SELECT je.*, coa.name as coa_name
                FROM JournalEntry je
                LEFT JOIN ChartOfAccount coa ON je.coa_code = coa.code
                WHERE je.journalId = ?
                ORDER BY je.id ASC
            `, [r.journal_id]);
            entries = jeRows;
        }

        res.json({
            ...r,
            gaji_kotor: gajiKotor,
            gaji_bersih: gajiBersih,
            bulan_nama: getMonthName(parseMonthNumber(r.bulan)),
            journal_entries: entries
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEmployees = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT k.id, k.nik, k.nama, k.jabatan, d.nama_departemen as departemen
            FROM karyawan k
            LEFT JOIN departemen d ON k.departemen_id = d.id
            ORDER BY k.nama ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPayroll = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const {
            karyawan_id,
            bulan,
            tahun,
            gaji_pokok,
            tunjangan,
            bonus,
            potongan,
            status_pembayaran = 'Sudah Dibayar',
            pph21_type = 'tanpa_pajak',
            pph21_rate = 0,
            pph21 = 0,
            tanggal_dibayar,
            catatan
        } = req.body;

        if (!karyawan_id) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ message: 'Karyawan wajib dipilih' });
        }

        const monthNum = parseMonthNumber(bulan);
        const monthStr = getMonthName(monthNum);
        const yearNum = Number(tahun) || new Date().getFullYear();

        const numGajiPokok = Number(gaji_pokok || 0);
        const numTunjangan = Number(tunjangan || 0);
        const numBonus = Number(bonus || 0);
        const numPotongan = Number(potongan || 0);
        const numPph21 = pph21_type === 'custom' ? Number(pph21 || 0) : 0;
        const numPph21Rate = Number(pph21_rate || 0);

        const bebanGaji = Math.max(0, numGajiPokok + numTunjangan + numBonus - numPotongan);
        const gajiBersih = Math.max(0, bebanGaji - numPph21);

        const payDate = tanggal_dibayar || new Date().toISOString().slice(0, 10);
        const status = ['Sudah Dibayar', 'Dibayar'].includes(status_pembayaran) ? 'Dibayar' : status_pembayaran;

        // Insert into payroll table
        const [result] = await conn.query(`
            INSERT INTO payroll (
                karyawan_id, bulan, tahun, gaji_pokok, tunjangan, bonus, potongan,
                total_gaji, status_pembayaran, tanggal_dibuat, pph21, pph21_type,
                pph21_rate, tanggal_dibayar, catatan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
        `, [
            karyawan_id, monthStr, yearNum, numGajiPokok, numTunjangan, numBonus, numPotongan,
            gajiBersih, status, numPph21, pph21_type, numPph21Rate, payDate, catatan || null
        ]);

        const newPayrollId = result.insertId;

        // Generate journal & cashflow
        const syncResult = await syncJournalForPayroll(conn, newPayrollId);

        await conn.commit();
        conn.release();

        res.status(201).json({
            message: 'Slip gaji berhasil disimpan dan dijurnalkan',
            payrollId: newPayrollId,
            syncResult
        });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('createPayroll error:', error);
        res.status(500).json({ message: error.message });
    }
};

const updatePayroll = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { id } = req.params;
        const {
            karyawan_id,
            bulan,
            tahun,
            gaji_pokok,
            tunjangan,
            bonus,
            potongan,
            status_pembayaran = 'Sudah Dibayar',
            pph21_type = 'tanpa_pajak',
            pph21_rate = 0,
            pph21 = 0,
            tanggal_dibayar,
            catatan
        } = req.body;

        const monthNum = parseMonthNumber(bulan);
        const monthStr = getMonthName(monthNum);
        const yearNum = Number(tahun) || new Date().getFullYear();

        const numGajiPokok = Number(gaji_pokok || 0);
        const numTunjangan = Number(tunjangan || 0);
        const numBonus = Number(bonus || 0);
        const numPotongan = Number(potongan || 0);
        const numPph21 = pph21_type === 'custom' ? Number(pph21 || 0) : 0;
        const numPph21Rate = Number(pph21_rate || 0);

        const bebanGaji = Math.max(0, numGajiPokok + numTunjangan + numBonus - numPotongan);
        const gajiBersih = Math.max(0, bebanGaji - numPph21);

        const payDate = tanggal_dibayar || new Date().toISOString().slice(0, 10);
        const status = ['Sudah Dibayar', 'Dibayar'].includes(status_pembayaran) ? 'Dibayar' : status_pembayaran;

        await conn.query(`
            UPDATE payroll SET
                karyawan_id = ?, bulan = ?, tahun = ?, gaji_pokok = ?, tunjangan = ?,
                bonus = ?, potongan = ?, total_gaji = ?, status_pembayaran = ?,
                pph21 = ?, pph21_type = ?, pph21_rate = ?, tanggal_dibayar = ?, catatan = ?
            WHERE id = ?
        `, [
            karyawan_id, monthStr, yearNum, numGajiPokok, numTunjangan,
            numBonus, numPotongan, gajiBersih, status,
            numPph21, pph21_type, numPph21Rate, payDate, catatan || null, id
        ]);

        await syncJournalForPayroll(conn, id);

        await conn.commit();
        conn.release();

        res.json({ message: 'Slip gaji berhasil diperbarui dan jurnal disinkronkan' });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('updatePayroll error:', error);
        res.status(500).json({ message: error.message });
    }
};

const deletePayroll = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params;

        const [rows] = await conn.query('SELECT journal_id, cashflow_id FROM payroll WHERE id = ?', [id]);
        if (rows.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ message: 'Slip gaji tidak ditemukan' });
        }

        const { journal_id, cashflow_id } = rows[0];

        if (journal_id) {
            await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [journal_id]);
            await conn.query('DELETE FROM Journal WHERE id = ?', [journal_id]);
        }

        if (cashflow_id) {
            await conn.query('DELETE FROM Cashflow WHERE id = ?', [cashflow_id]);
        }

        await conn.query('DELETE FROM payroll WHERE id = ?', [id]);

        await conn.commit();
        conn.release();

        res.json({ message: 'Slip gaji dan jurnal terkait berhasil dihapus' });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('deletePayroll error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPayrolls,
    getPayrollById,
    getEmployees,
    createPayroll,
    updatePayroll,
    deletePayroll,
    autoSyncPayrollJournals,
    syncJournalForPayroll
};
