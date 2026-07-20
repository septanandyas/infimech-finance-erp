const db = require('../utils/db');

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

        const [invoiceRows] = await db.query(`
    SELECT id, invoice_number, total, due_date, notes, createdAt, status
    FROM Invoice
    WHERE status IN ('acc', 'partial', 'overdue')
    ORDER BY COALESCE(due_date, createdAt) ASC, id ASC
`);

        invoiceRows.forEach((item) => {
            const entryDate = formatDate(item.createdAt);
            if (!filterByMonthYear(entryDate, month, year)) return;

            rows.push({
                date: entryDate,
                account: coaMap['1200'] || 'Piutang Usaha',
                description: item.notes || `Invoice ${item.invoice_number || item.id}`,
                reference: `INV-${item.id}`,
                debit: Number(item.total || 0),
                credit: 0,
                source: 'invoice'
            });
            rows.push({
                date: entryDate,
                account: coaMap['4100'] || 'Pendapatan Jasa',
                description: item.notes || `Invoice ${item.invoice_number || item.id}`,
                reference: `INV-${item.id}`,
                debit: 0,
                credit: Number(item.total || 0),
                source: 'invoice'
            });
        });

        // UnearnedRevenue tidak lagi diproses di sini
        // Pembayaran DP/termin sudah dicatat otomatis di Cashflow (coa_code 2200)
        // saat addPayment dipanggil dari Invoice

        rows.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLedgerEntries };
