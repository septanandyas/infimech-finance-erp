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
 * Helper: hitung komponen gaji dari baris payroll
 */
const calcPayrollComponents = (p) => {
    const gajiPokok = Number(p.gaji_pokok || 0);
    const tunjangan = Number(p.tunjangan || 0);
    const bonus = Number(p.bonus || 0);
    const potongan = Number(p.potongan || 0);
    const pph21 = p.pph21_type === 'custom' ? Number(p.pph21 || 0) : 0;
    const bebanGaji = Math.max(0, gajiPokok + tunjangan + bonus - potongan); // gaji kotor
    const takeHomePay = Math.max(0, bebanGaji - pph21);                      // take home pay
    return { bebanGaji, takeHomePay, pph21 };
};

/**
 * Sinkronisasi jurnal untuk satu payroll record.
 *
 * Alur 3 jurnal:
 * ─────────────────────────────────────────────────────────
 * Jurnal 1 — Pengakuan (selalu dibuat, berapapun statusnya):
 *   Debit  5100  Gaji Karyawan      = bebanGaji
 *   Kredit 2600  Utang Gaji         = takeHomePay
 *   Kredit 2300  Utang PPh 21       = pph21  (jika > 0)
 *
 * Jurnal 2 — Pelunasan ke karyawan (hanya saat Dibayar):
 *   Debit  2600  Utang Gaji         = takeHomePay
 *   Kredit 1100  Kas                = takeHomePay
 *
 * Jurnal 3 — Setor PPh 21 (hanya saat Dibayar DAN pph21 > 0):
 *   Debit  2300  Utang PPh 21       = pph21
 *   Kredit 1100  Kas                = pph21
 * ─────────────────────────────────────────────────────────
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

    const { bebanGaji, takeHomePay, pph21 } = calcPayrollComponents(p);

    const monthNum = parseMonthNumber(p.bulan);
    const monthStr = getMonthName(monthNum);
    const yearNum = Number(p.tahun) || new Date().getFullYear();
    const empName = p.nama_karyawan || 'Karyawan';

    const payDate = p.tanggal_dibayar
        ? (p.tanggal_dibayar.toISOString?.()?.slice(0, 10) || p.tanggal_dibayar)
        : `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;

    const refAccrual  = `PAY-ACR-${yearNum}${String(monthNum).padStart(2, '0')}-${String(p.id).padStart(3, '0')}`;
    const refPayment  = `PAY-PAY-${yearNum}${String(monthNum).padStart(2, '0')}-${String(p.id).padStart(3, '0')}`;
    const refPph21    = `PAY-PPH-${yearNum}${String(monthNum).padStart(2, '0')}-${String(p.id).padStart(3, '0')}`;
    const descAccrual = `Pengakuan Beban Gaji - ${empName} (${monthStr} ${yearNum})`;
    const descPayment = `Pelunasan Utang Gaji - ${empName} (${monthStr} ${yearNum})`;
    const descPph21   = `Setor PPh 21 - ${empName} (${monthStr} ${yearNum})`;

    const isPaid = ['Dibayar', 'Sudah Dibayar'].includes(p.status_pembayaran);

    // ─── JURNAL 1: Pengakuan (selalu) ───────────────────────────────────────
    let accrualJournalId = p.journal_id;

    if (accrualJournalId) {
        const [jExists] = await conn.query('SELECT id FROM Journal WHERE id = ?', [accrualJournalId]);
        if (jExists.length > 0) {
            await conn.query(`
                UPDATE Journal
                SET journal_date = ?, description = ?, reference = ?, type = 'payroll_accrual',
                    period_month = ?, period_year = ?
                WHERE id = ?
            `, [payDate, descAccrual, refAccrual, monthNum, yearNum, accrualJournalId]);
            await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [accrualJournalId]);
        } else {
            accrualJournalId = null;
        }
    }

    if (!accrualJournalId) {
        // Coba cari by reference dulu
        const [byRef] = await conn.query(
            `SELECT id FROM Journal WHERE reference = ? AND type = 'payroll_accrual'`,
            [refAccrual]
        );
        if (byRef.length > 0) {
            accrualJournalId = byRef[0].id;
            await conn.query(`
                UPDATE Journal
                SET journal_date = ?, description = ?, period_month = ?, period_year = ?
                WHERE id = ?
            `, [payDate, descAccrual, monthNum, yearNum, accrualJournalId]);
            await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [accrualJournalId]);
        } else {
            const [jRes] = await conn.query(`
                INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
                VALUES (?, ?, ?, 'payroll_accrual', ?, ?, NOW())
            `, [payDate, descAccrual, refAccrual, monthNum, yearNum]);
            accrualJournalId = jRes.insertId;
        }
    }

    // Insert entries jurnal pengakuan
    await conn.query(`
        INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
        VALUES (?, '5100', ?, ?, 0)
    `, [accrualJournalId, descAccrual, bebanGaji]);

    await conn.query(`
        INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
        VALUES (?, '2600', ?, 0, ?)
    `, [accrualJournalId, `Utang Gaji - ${empName}`, takeHomePay]);

    if (pph21 > 0) {
        await conn.query(`
            INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
            VALUES (?, '2300', ?, 0, ?)
        `, [accrualJournalId, `Utang PPh 21 - ${empName}`, pph21]);
    }

    // ─── JURNAL 2 & 3: Pelunasan (hanya saat Dibayar) ───────────────────────
    let paymentJournalId = p.payment_journal_id || null;
    let pph21JournalId   = p.pph21_journal_id   || null;

    if (isPaid) {
        // -- Jurnal 2: Pelunasan ke karyawan
        if (paymentJournalId) {
            const [jExists] = await conn.query('SELECT id FROM Journal WHERE id = ?', [paymentJournalId]);
            if (jExists.length > 0) {
                await conn.query(`
                    UPDATE Journal
                    SET journal_date = ?, description = ?, reference = ?, type = 'payroll_payment',
                        period_month = ?, period_year = ?
                    WHERE id = ?
                `, [payDate, descPayment, refPayment, monthNum, yearNum, paymentJournalId]);
                await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [paymentJournalId]);
            } else {
                paymentJournalId = null;
            }
        }

        if (!paymentJournalId) {
            const [byRef] = await conn.query(
                `SELECT id FROM Journal WHERE reference = ? AND type = 'payroll_payment'`,
                [refPayment]
            );
            if (byRef.length > 0) {
                paymentJournalId = byRef[0].id;
                await conn.query(`
                    UPDATE Journal
                    SET journal_date = ?, description = ?, period_month = ?, period_year = ?
                    WHERE id = ?
                `, [payDate, descPayment, monthNum, yearNum, paymentJournalId]);
                await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [paymentJournalId]);
            } else {
                const [jRes] = await conn.query(`
                    INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
                    VALUES (?, ?, ?, 'payroll_payment', ?, ?, NOW())
                `, [payDate, descPayment, refPayment, monthNum, yearNum]);
                paymentJournalId = jRes.insertId;
            }
        }

        await conn.query(`
            INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
            VALUES (?, '2600', ?, ?, 0)
        `, [paymentJournalId, `Pelunasan Utang Gaji - ${empName}`, takeHomePay]);

        await conn.query(`
            INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
            VALUES (?, '1100', ?, 0, ?)
        `, [paymentJournalId, `Kas Keluar Gaji - ${empName}`, takeHomePay]);

        // -- Jurnal 3: Setor PPh 21
        if (pph21 > 0) {
            if (pph21JournalId) {
                const [jExists] = await conn.query('SELECT id FROM Journal WHERE id = ?', [pph21JournalId]);
                if (jExists.length > 0) {
                    await conn.query(`
                        UPDATE Journal
                        SET journal_date = ?, description = ?, reference = ?, type = 'payroll_pph21',
                            period_month = ?, period_year = ?
                        WHERE id = ?
                    `, [payDate, descPph21, refPph21, monthNum, yearNum, pph21JournalId]);
                    await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [pph21JournalId]);
                } else {
                    pph21JournalId = null;
                }
            }

            if (!pph21JournalId) {
                const [byRef] = await conn.query(
                    `SELECT id FROM Journal WHERE reference = ? AND type = 'payroll_pph21'`,
                    [refPph21]
                );
                if (byRef.length > 0) {
                    pph21JournalId = byRef[0].id;
                    await conn.query(`
                        UPDATE Journal
                        SET journal_date = ?, description = ?, period_month = ?, period_year = ?
                        WHERE id = ?
                    `, [payDate, descPph21, monthNum, yearNum, pph21JournalId]);
                    await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [pph21JournalId]);
                } else {
                    const [jRes] = await conn.query(`
                        INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
                        VALUES (?, ?, ?, 'payroll_pph21', ?, ?, NOW())
                    `, [payDate, descPph21, refPph21, monthNum, yearNum]);
                    pph21JournalId = jRes.insertId;
                }
            }

            await conn.query(`
                INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
                VALUES (?, '2300', ?, ?, 0)
            `, [pph21JournalId, `Setor PPh 21 - ${empName}`, pph21]);

            await conn.query(`
                INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit)
                VALUES (?, '1100', ?, 0, ?)
            `, [pph21JournalId, `Kas Keluar PPh 21 - ${empName}`, pph21]);
        } else {
            // Tidak ada PPh 21 — hapus jurnal PPh 21 lama jika ada
            if (pph21JournalId) {
                await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [pph21JournalId]);
                await conn.query('DELETE FROM Journal WHERE id = ?', [pph21JournalId]);
                pph21JournalId = null;
            }
        }

        // Cashflow untuk tracking kas keluar (kas sisi 1100)
        const gajiBersih = takeHomePay;
        let cashflowId = p.cashflow_id || null;

        if (!cashflowId) {
            const [byDesc] = await conn.query(
                `SELECT id FROM Cashflow WHERE source = 'payroll' AND description = ? AND date = ?`,
                [`Pembayaran Gaji - ${empName} (${monthStr} ${yearNum})`, payDate]
            );
            if (byDesc.length > 0) cashflowId = byDesc[0].id;
        }

        if (cashflowId) {
            const [cfExists] = await conn.query('SELECT id FROM Cashflow WHERE id = ?', [cashflowId]);
            if (cfExists.length > 0) {
                await conn.query(`
                    UPDATE Cashflow
                    SET type = 'expense', category = 'Gaji', amount = ?, description = ?, date = ?,
                        coa_code = '1100', source = 'payroll', updatedAt = NOW()
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

        // Update referensi di payroll
        await conn.query(`
            UPDATE payroll
            SET journal_id = ?, payment_journal_id = ?, pph21_journal_id = ?, cashflow_id = ?, total_gaji = ?
            WHERE id = ?
        `, [accrualJournalId, paymentJournalId, pph21JournalId || null, cashflowId, takeHomePay, payrollId]);

    } else {
        // Belum Dibayar — hapus jurnal pelunasan & PPh 21 jika ada (sisa dari update status)
        if (paymentJournalId) {
            await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [paymentJournalId]);
            await conn.query('DELETE FROM Journal WHERE id = ?', [paymentJournalId]);
            paymentJournalId = null;
        }
        if (pph21JournalId) {
            await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [pph21JournalId]);
            await conn.query('DELETE FROM Journal WHERE id = ?', [pph21JournalId]);
            pph21JournalId = null;
        }
        if (p.cashflow_id) {
            await conn.query('DELETE FROM Cashflow WHERE id = ?', [p.cashflow_id]);
        }

        await conn.query(`
            UPDATE payroll
            SET journal_id = ?, payment_journal_id = NULL, pph21_journal_id = NULL,
                cashflow_id = NULL, total_gaji = ?
            WHERE id = ?
        `, [accrualJournalId, takeHomePay, payrollId]);
    }

    return { accrualJournalId, paymentJournalId, pph21JournalId, bebanGaji, takeHomePay, pph21 };
};

/**
 * Cooldown-based guard untuk autoSyncPayrollJournals.
 * Hanya berjalan jika belum dijalankan dalam SYNC_COOLDOWN_MS terakhir.
 * Ini mencegah re-sync mahal pada setiap request Buku Besar / Neraca / LabaRugi.
 * Jurnal tetap konsisten karena createPayroll/updatePayroll/settlePayroll
 * selalu memanggil syncJournalForPayroll secara langsung.
 */
const SYNC_COOLDOWN_MS = 30_000; // 30 detik
let _lastSyncTime = 0;
let _isSyncing = false;

const autoSyncPayrollJournals = async () => {
    const now = Date.now();
    if (_isSyncing) return;                          // sedang berjalan
    if (now - _lastSyncTime < SYNC_COOLDOWN_MS) return; // masih dalam cooldown

    _isSyncing = true;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [allPayrolls] = await conn.query(`SELECT id FROM payroll`);
        for (const row of allPayrolls) {
            await syncJournalForPayroll(conn, row.id);
        }
        await conn.commit();
        _lastSyncTime = Date.now(); // update waktu sync terakhir hanya jika berhasil
    } catch (err) {
        await conn.rollback();
        console.error('autoSyncPayrollJournals error:', err);
    } finally {
        conn.release();
        _isSyncing = false;
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
            const { bebanGaji, takeHomePay, pph21 } = calcPayrollComponents(r);
            return {
                ...r,
                gaji_kotor: bebanGaji,
                gaji_bersih: takeHomePay,
                pph21_amount: pph21,
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
        const { bebanGaji, takeHomePay, pph21 } = calcPayrollComponents(r);

        // Ambil semua jurnal terkait (pengakuan, pelunasan, PPh 21)
        const journalIds = [r.journal_id, r.payment_journal_id, r.pph21_journal_id].filter(Boolean);
        let entries = [];
        if (journalIds.length > 0) {
            const [jeRows] = await db.query(`
                SELECT je.*, coa.name as coa_name, j.type as journal_type, j.reference as journal_reference
                FROM JournalEntry je
                LEFT JOIN ChartOfAccount coa ON je.coa_code = coa.code
                LEFT JOIN Journal j ON je.journalId = j.id
                WHERE je.journalId IN (${journalIds.map(() => '?').join(',')})
                ORDER BY je.journalId ASC, je.id ASC
            `, journalIds);
            entries = jeRows;
        }

        res.json({
            ...r,
            gaji_kotor: bebanGaji,
            gaji_bersih: takeHomePay,
            pph21_amount: pph21,
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
            status_pembayaran = 'Belum Dibayar',
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
        const takeHomePay = Math.max(0, bebanGaji - numPph21);

        const payDate = tanggal_dibayar || new Date().toISOString().slice(0, 10);
        const status = ['Sudah Dibayar', 'Dibayar'].includes(status_pembayaran) ? 'Dibayar' : status_pembayaran;

        const [result] = await conn.query(`
            INSERT INTO payroll (
                karyawan_id, bulan, tahun, gaji_pokok, tunjangan, bonus, potongan,
                total_gaji, status_pembayaran, tanggal_dibuat, pph21, pph21_type,
                pph21_rate, tanggal_dibayar, catatan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
        `, [
            karyawan_id, monthStr, yearNum, numGajiPokok, numTunjangan, numBonus, numPotongan,
            takeHomePay, status, numPph21, pph21_type, numPph21Rate, payDate, catatan || null
        ]);

        const newPayrollId = result.insertId;
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
            status_pembayaran = 'Belum Dibayar',
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
        const takeHomePay = Math.max(0, bebanGaji - numPph21);

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
            numBonus, numPotongan, takeHomePay, status,
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

        const [rows] = await conn.query(
            'SELECT journal_id, payment_journal_id, pph21_journal_id, cashflow_id FROM payroll WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ message: 'Slip gaji tidak ditemukan' });
        }

        const { journal_id, payment_journal_id, pph21_journal_id, cashflow_id } = rows[0];

        // Hapus semua jurnal terkait
        for (const jId of [journal_id, payment_journal_id, pph21_journal_id].filter(Boolean)) {
            await conn.query('DELETE FROM JournalEntry WHERE journalId = ?', [jId]);
            await conn.query('DELETE FROM Journal WHERE id = ?', [jId]);
        }

        if (cashflow_id) {
            await conn.query('DELETE FROM Cashflow WHERE id = ?', [cashflow_id]);
        }

        await conn.query('DELETE FROM payroll WHERE id = ?', [id]);

        await conn.commit();
        conn.release();

        res.json({ message: 'Slip gaji dan semua jurnal terkait berhasil dihapus' });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('deletePayroll error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Tandai payroll sebagai Dibayar (ubah status → Dibayar, buat jurnal pelunasan & cashflow)
 * POST /api/payroll/:id/settle
 */
const settlePayroll = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params;
        const { tanggal_dibayar } = req.body;

        const [rows] = await conn.query('SELECT * FROM payroll WHERE id = ?', [id]);
        if (rows.length === 0) {
            await conn.rollback(); conn.release();
            return res.status(404).json({ message: 'Slip gaji tidak ditemukan' });
        }
        const p = rows[0];
        if (['Dibayar', 'Sudah Dibayar'].includes(p.status_pembayaran)) {
            await conn.rollback(); conn.release();
            return res.status(400).json({ message: 'Gaji sudah dilunasi sebelumnya' });
        }

        const payDate = tanggal_dibayar || new Date().toISOString().slice(0, 10);

        await conn.query(
            `UPDATE payroll SET status_pembayaran = 'Dibayar', tanggal_dibayar = ? WHERE id = ?`,
            [payDate, id]
        );

        await syncJournalForPayroll(conn, id);

        await conn.commit();
        conn.release();

        res.json({ message: 'Gaji berhasil dilunasi dan jurnal pelunasan dibuat' });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('settlePayroll error:', error);
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
    settlePayroll,
    autoSyncPayrollJournals,
    syncJournalForPayroll
};
