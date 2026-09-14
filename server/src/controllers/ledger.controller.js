const db = require('../utils/db');
const { autoInsertDepreciation } = require('./journal.controller');
const { autoSyncPayrollJournals } = require('./payroll.controller');

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

        // Penyusutan tetap di-insert jika belum ada (ringan, tidak iterasi semua payroll)
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
        // Tambahkan jurnal non-kas (penyusutan, payroll, piutang, dll)
        const [journalRows] = await db.query(`
            SELECT j.id as journal_id, j.journal_date, j.reference, je.id as entry_id, je.coa_code, je.description as entry_desc, je.debit, je.credit
            FROM Journal j
            JOIN JournalEntry je ON je.journalId = j.id
            WHERE j.period_month = ? AND j.period_year = ?
            ORDER BY j.journal_date ASC, j.reference ASC, je.debit DESC, je.id ASC
        `, [month || new Date().getMonth() + 1, year || new Date().getFullYear()]);

        journalRows.forEach(row => {
            const entryDate = row.journal_date?.toISOString?.()?.slice(0, 10) || row.journal_date;
            rows.push({
                date: entryDate,
                account: coaMap[row.coa_code] || row.coa_code,
                coa_code: row.coa_code,
                description: row.entry_desc,
                reference: row.reference,
                debit: Number(row.debit || 0),
                credit: Number(row.credit || 0),
                source: 'journal'
            });
        });

        // Urutkan rapi: Tanggal ASC -> Reference ASC -> Debit lebih dulu (D > 0 sebelum K > 0)
        rows.sort((a, b) => {
            const dateCmp = (a.date || '').localeCompare(b.date || '');
            if (dateCmp !== 0) return dateCmp;

            const refCmp = (a.reference || '').localeCompare(b.reference || '');
            if (refCmp !== 0) return refCmp;

            // Debit muncul sebelum Kredit dalam satu transaksi
            if (a.debit > 0 && b.debit === 0) return -1;
            if (a.debit === 0 && b.debit > 0) return 1;

            return 0;
        });

        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLedgerEntries };
