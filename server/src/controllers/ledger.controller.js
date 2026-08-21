const db = require('../utils/db');
const { autoInsertDepreciation } = require('./journal.controller');

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

const filterByMonthYear = (date, month, year) => {
    if (!date) return true;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return true;
    const targetMonth = Number(month);
    const targetYear = Number(year);
    if (month && year) {
        return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
    }
    if (month) {
        return d.getMonth() + 1 === targetMonth;
    }
    if (year) {
        return d.getFullYear() === targetYear;
    }
    return true;
};

const getLedgerEntries = async (req, res) => {
    try {
        const { month, year } = req.query;
        const rows = [];

        // Auto-insert penyusutan bulan ini kalau belum ada
        if (month && year) {
            await autoInsertDepreciation(parseInt(month), parseInt(year));
        }

        // Fetch COA untuk mapping
        const [coaRows] = await db.query('SELECT code, name FROM ChartOfAccount');
        const coaMap = {};
        coaRows.forEach(c => { coaMap[c.code] = `[${c.code}] ${c.name}`; });

        const [cashflowRows] = await db.query(`
            SELECT id, type, category, amount, description, date, coa_code
            FROM Cashflow
            ORDER BY date ASC, id ASC
        `);

        // COA yang entry-nya sudah SEPENUHNYA dicatat di JournalEntry (LP-xxx / LB-xxx):
        // - 2100 Hutang Usaha: cicilan hutang sudah ada via Journal LP-xxx (Debit 2100, Kredit 1100)
        // - 1100 Kas: jangan buat "Kas pada Kas"
        // Cashflow dengan COA ini cukup untuk data cashflow, tapi SKIP di ledger.
        const SKIP_IN_LEDGER = new Set(['2100', '1100']);

        cashflowRows.forEach((item) => {
            const entryDate = formatDate(item.date);
            if (!filterByMonthYear(entryDate, month, year)) return;

            const bebanAkun = item.coa_code && coaMap[item.coa_code]
                ? coaMap[item.coa_code]
                : item.category || 'Biaya';

            // Skip entries yang sudah ditangani JournalEntry
            if (SKIP_IN_LEDGER.has(item.coa_code)) return;

            if (item.type === 'income') {
                // Kas masuk (Debit Kas)
                rows.push({
                    date: entryDate,
                    account: coaMap['1100'] || 'Kas',
                    description: item.description || `Penerimaan ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: Number(item.amount || 0),
                    credit: 0,
                    source: 'cashflow'
                });
                // Kredit akun lawan (2200, 2400, 4100, dst)
                rows.push({
                    date: entryDate,
                    account: item.coa_code && coaMap[item.coa_code]
                        ? coaMap[item.coa_code]
                        : item.category || 'Pendapatan',
                    description: item.description || `Penerimaan ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: 0,
                    credit: Number(item.amount || 0),
                    source: 'cashflow'
                });
            } else {
                // Debit akun beban/aset (6100, 6400, 1500, dst)
                rows.push({
                    date: entryDate,
                    account: bebanAkun,
                    description: item.description || `Pengeluaran ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: Number(item.amount || 0),
                    credit: 0,
                    source: 'cashflow'
                });
                // Kredit Kas
                rows.push({
                    date: entryDate,
                    account: coaMap['1100'] || 'Kas',
                    description: item.description || `Pengeluaran ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: 0,
                    credit: Number(item.amount || 0),
                    source: 'cashflow'
                });
            }
        });

        // Piutang & pengakuan pendapatan sekarang otomatis muncul lewat
        // journalRows di bawah (di-insert oleh addPayment saat invoice
        // pelunasan membayar lunas kontraknya).
        // Tambahkan jurnal non-kas (penyusutan, dll)
        const [journalRows] = await db.query(`
    SELECT j.journal_date, j.reference, je.coa_code, je.description as entry_desc, je.debit, je.credit
    FROM Journal j
    JOIN JournalEntry je ON je.journalId = j.id
    WHERE j.period_month = ? AND j.period_year = ?
    ORDER BY j.journal_date ASC
`, [month || new Date().getMonth() + 1, year || new Date().getFullYear()]);

        journalRows.forEach(row => {
            const entryDate = row.journal_date?.toISOString?.()?.slice(0, 10) || row.journal_date;
            rows.push({
                date: entryDate,
                account: coaMap[row.coa_code] || row.coa_code,
                description: row.entry_desc,
                reference: row.reference,
                debit: Number(row.debit || 0),
                credit: Number(row.credit || 0),
                source: 'journal'
            });
        });

        rows.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLedgerEntries };
