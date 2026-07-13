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

        const [cashflowRows] = await db.query(`
            SELECT id, type, category, amount, description, date, projectId
            FROM Cashflow
            ORDER BY date ASC, id ASC
        `);

        cashflowRows.forEach((item) => {
            const entryDate = formatDate(item.date);
            if (!filterByMonthYear(entryDate, month, year)) return;

            if (item.type === 'income') {
                rows.push({
                    date: entryDate,
                    account: 'Kas',
                    description: item.description || `Penerimaan ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: Number(item.amount || 0),
                    credit: 0,
                    source: 'cashflow'
                });
                rows.push({
                    date: entryDate,
                    account: 'Pendapatan',
                    description: item.description || `Penerimaan ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: 0,
                    credit: Number(item.amount || 0),
                    source: 'cashflow'
                });
            } else {
                rows.push({
                    date: entryDate,
                    account: 'Kas',
                    description: item.description || `Pengeluaran ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: 0,
                    credit: Number(item.amount || 0),
                    source: 'cashflow'
                });
                rows.push({
                    date: entryDate,
                    account: item.category || 'Biaya',
                    description: item.description || `Pengeluaran ${item.category}`,
                    reference: `CF-${item.id}`,
                    debit: Number(item.amount || 0),
                    credit: 0,
                    source: 'cashflow'
                });
            }
        });

        const [invoiceRows] = await db.query(`
            SELECT id, invoice_number, total, due_date, notes, createdAt
            FROM Invoice
            ORDER BY COALESCE(due_date, createdAt) ASC, id ASC
        `);

        invoiceRows.forEach((item) => {
            const entryDate = formatDate(item.due_date || item.createdAt);
            if (!filterByMonthYear(entryDate, month, year)) return;

            rows.push({
                date: entryDate,
                account: 'Piutang Usaha',
                description: item.notes || `Invoice ${item.invoice_number || item.id}`,
                reference: `INV-${item.id}`,
                debit: Number(item.total || 0),
                credit: 0,
                source: 'invoice'
            });
            rows.push({
                date: entryDate,
                account: 'Pendapatan Jasa',
                description: item.notes || `Invoice ${item.invoice_number || item.id}`,
                reference: `INV-${item.id}`,
                debit: 0,
                credit: Number(item.total || 0),
                source: 'invoice'
            });
        });

        const [unearnedRows] = await db.query(`
            SELECT id, amount, category, received_date, notes, status
            FROM UnearnedRevenue
            ORDER BY received_date ASC, id ASC
        `);

        unearnedRows.forEach((item) => {
            const entryDate = formatDate(item.received_date);
            if (!filterByMonthYear(entryDate, month, year)) return;
            if (item.status === 'recognized') return;

            rows.push({
                date: entryDate,
                account: 'Kas',
                description: item.notes || `Unearned Revenue ${item.category || ''}`,
                reference: `UR-${item.id}`,
                debit: Number(item.amount || 0),
                credit: 0,
                source: 'unearned'
            });
            rows.push({
                date: entryDate,
                account: 'Pendapatan Diterima di Muka',
                description: item.notes || `Unearned Revenue ${item.category || ''}`,
                reference: `UR-${item.id}`,
                debit: 0,
                credit: Number(item.amount || 0),
                source: 'unearned'
            });
        });

        rows.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLedgerEntries };
