const db = require('../utils/db');

const autoInsertDepreciation = async (month, year) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Cek apakah jurnal penyusutan bulan ini sudah ada
        const [existing] = await conn.query(
            `SELECT id FROM Journal WHERE type='depreciation' AND period_month=? AND period_year=?`,
            [month, year]
        );
        if (existing.length > 0) {
            conn.release();
            return { skipped: true };
        }

        // Ambil semua aset aktif
        const [assets] = await conn.query(`SELECT * FROM FixedAsset WHERE status='active'`);
        if (assets.length === 0) {
            conn.release();
            return { skipped: true };
        }

        // Hitung penyusutan per aset untuk bulan ini
        const lastDay = new Date(year, month, 0).getDate();
        const journalDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        let totalDepreciation = 0;
        const entries = [];

        assets.forEach(asset => {
            const acquired = new Date(asset.acquisition_date);
            const targetDate = new Date(year, month - 1, 1);
            if (acquired > targetDate) return;

            const totalMonths = asset.useful_life_years * 12;
            const depreciableValue = Number(asset.acquisition_value) - Number(asset.salvage_value || 0);
            const monthlyDepreciation = depreciableValue / totalMonths;

            // Cek apakah sudah habis disusutkan
            const monthsElapsed = (targetDate.getFullYear() - acquired.getFullYear()) * 12 + (targetDate.getMonth() - acquired.getMonth());
            if (monthsElapsed >= totalMonths) return;

            totalDepreciation += monthlyDepreciation;
            entries.push({
                assetName: asset.name,
                amount: monthlyDepreciation
            });
        });

        if (totalDepreciation === 0) {
            await conn.rollback();
            conn.release();
            return { skipped: true };
        }

        // Insert ke tabel Journal
        const [journal] = await conn.query(
            `INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
             VALUES (?, ?, ?, 'depreciation', ?, ?, NOW())`,
            [journalDate, `Penyusutan Aset Tetap - ${month}/${year}`, `DEP-${year}-${String(month).padStart(2, '0')}`, month, year]
        );
        const journalId = journal.insertId;

        // Insert JournalEntry — Debit Beban Penyusutan (5200), Kredit Akm. Penyusutan (1500)
        await conn.query(
            `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
            [entries.map(e => [journalId, '5900', `Beban Penyusutan - ${e.assetName}`, e.amount, 0])]
        );
        await conn.query(
            `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
            [entries.map(e => [journalId, '1600', `Akm. Penyusutan - ${e.assetName}`, 0, e.amount])]
        );

        await conn.commit();
        conn.release();
        return { success: true, journalId, totalDepreciation };
    } catch (error) {
        await conn.rollback();
        conn.release();
        throw error;
    }
};

const getJournals = async (req, res) => {
    try {
        const { month, year } = req.query;
        const rows = [];

        // Auto-insert penyusutan kalau belum ada
        if (month && year) {
            await autoInsertDepreciation(parseInt(month), parseInt(year));
        }

        // Ambil semua journal + entries untuk periode ini
        let sql = `SELECT j.*, je.coa_code, je.description as entry_desc, je.debit, je.credit
                   FROM Journal j
                   JOIN JournalEntry je ON je.journalId = j.id
                   WHERE 1=1`;
        const params = [];
        if (month && year) {
            sql += ' AND j.period_month = ? AND j.period_year = ?';
            params.push(month, year);
        }
        sql += ' ORDER BY j.journal_date ASC, j.id ASC';

        const [journalRows] = await db.query(sql, params);

        // Format ke struktur yang sama dengan ledger
        const [coaRows] = await db.query('SELECT code, name FROM ChartOfAccount');
        const coaMap = {};
        coaRows.forEach(c => { coaMap[c.code] = `[${c.code}] ${c.name}`; });

        journalRows.forEach(row => {
            rows.push({
                date: row.journal_date?.toISOString?.()?.slice(0, 10) || row.journal_date,
                account: coaMap[row.coa_code] || row.coa_code,
                description: row.entry_desc || row.description,
                reference: row.reference,
                debit: Number(row.debit || 0),
                credit: Number(row.credit || 0),
                source: 'journal'
            });
        });

        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getJournals, autoInsertDepreciation };