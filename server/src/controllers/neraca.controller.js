const db = require('../utils/db');

const getNeraca = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year || new Date().getFullYear();

        // Total pemasukan (aset)
        const [income] = await db.query(
            "SELECT SUM(amount) as total FROM Cashflow WHERE type='income' AND YEAR(date) = ?",
            [targetYear]
        );

        // Total pengeluaran (kewajiban)
        const [expense] = await db.query(
            "SELECT SUM(amount) as total FROM Cashflow WHERE type='expense' AND YEAR(date) = ?",
            [targetYear]
        );

        // Invoice paid (piutang terlunasi)
        const [paidInvoice] = await db.query(
            "SELECT SUM(total) as total FROM Invoice WHERE status='paid' AND YEAR(paid_date) = ?",
            [targetYear]
        );

        // Invoice outstanding (piutang belum lunas)
        const [outstandingInvoice] = await db.query(
            "SELECT SUM(total) as total FROM Invoice WHERE status IN ('sent','overdue')",
            []
        );

        const totalIncome = income[0].total || 0;
        const totalExpense = expense[0].total || 0;
        const modal = totalIncome - totalExpense;

        res.json({
            aset: {
                kas: totalIncome - totalExpense,
                piutang: outstandingInvoice[0].total || 0,
                total: (totalIncome - totalExpense) + (outstandingInvoice[0].total || 0)
            },
            kewajiban: {
                total: totalExpense
            },
            modal: {
                laba: modal,
                total: modal
            },
            invoicePaid: paidInvoice[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNeraca };