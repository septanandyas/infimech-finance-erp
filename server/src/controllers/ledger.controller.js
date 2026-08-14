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

        cashflowRows.forEach((item) => {
            const entryDate = formatDate(item.date);
            if (!filterByMonthYear(entryDate, month, year)) return;

            // Nama akun dari COA kalau ada, fallback ke category
            const bebanAkun = item.coa_code && coaMap[item.coa_code]
                ? coaMap[item.coa_code]
                : item.category || 'Biaya';

            if (item.type === 'income') {
                rows.push({
                    date: entryDate,
                    account: coaMap['1100'] || 'Kas',
                    description: item.description || `Penerimaan ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: Number(item.amount || 0),
                    credit: 0,
                    source: 'cashflow'
                });
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
                rows.push({
                    date: entryDate,
                    account: coaMap['1100'] || 'Kas',
                    description: item.description || `Pengeluaran ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: 0,
                    credit: Number(item.amount || 0),
                    source: 'cashflow'
                });
                rows.push({
                    date: entryDate,
                    account: bebanAkun,
                    description: item.description || `Pengeluaran ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: Number(item.amount || 0),
                    credit: 0,
                    source: 'cashflow'
                });
            }
        });

        const [contractRows] = await db.query(`
            SELECT c.id, c.contract_number, c.contract_value, c.contract_date,
           p.name_project, p.client_name,
           COALESCE(SUM(ip.amount / (1 + COALESCE(i.tax_rate, 0) / 100)), 0) as total_paid
            FROM ProjectContract c
            JOIN Prospect p ON c.projectId = p.no_project
            LEFT JOIN Invoice i ON i.contractId = c.id AND i.status IN ('acc','partial','paid')
            LEFT JOIN InvoicePayment ip ON ip.invoiceId = i.id
            WHERE c.status = 'active'
            GROUP BY c.id
        `);

        contractRows.forEach((item) => {
            const entryDate = formatDate(item.contract_date);
            if (!filterByMonthYear(entryDate, month, year)) return;

            const outstanding = Number(item.contract_value) - Number(item.total_paid);
            if (outstanding <= 0) return;

            rows.push({
                date: entryDate,
                account: coaMap['1200'] || 'Piutang Usaha',
                description: `Piutang kontrak - ${item.name_project} (${item.client_name})`,
                reference: `CTR-${item.id}`,
                debit: outstanding,
                credit: 0,
                source: 'contract'
            });
            rows.push({
                date: entryDate,
                account: coaMap['2200'] || 'Pendapatan Diterima di Muka',
                description: `Piutang kontrak - ${item.name_project} (${item.client_name})`,
                reference: `CTR-${item.id}`,
                debit: 0,
                credit: outstanding,
                source: 'contract'
            });
        });

        // UnearnedRevenue tidak lagi diproses di sini
        // Pembayaran DP/termin sudah dicatat otomatis di Cashflow (coa_code 2200)
        // saat addPayment dipanggil dari Invoice

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
