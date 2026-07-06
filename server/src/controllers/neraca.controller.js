const db = require('../utils/db');

const getNeraca = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year || new Date().getFullYear();

        // Kas: total pemasukan cashflow
        const [income] = await db.query(
            "SELECT SUM(amount) as total FROM Cashflow WHERE type='income' AND YEAR(date) = ?",
            [targetYear]
        );

        // Pengeluaran operasional
        const [expense] = await db.query(
            "SELECT SUM(amount) as total FROM Cashflow WHERE type='expense' AND YEAR(date) = ?",
            [targetYear]
        );

        // Piutang: invoice outstanding (belum dibayar)
        const [outstanding] = await db.query(
            "SELECT SUM(total) as total FROM Invoice WHERE status IN ('sent','overdue')",
            []
        );

        const totalIncome = Number(income[0].total) || 0;
        const totalExpense = Number(expense[0].total) || 0;
        const totalPiutang = Number(outstanding[0].total) || 0;

        // Kas bersih = pemasukan - pengeluaran
        const kas = totalIncome - totalExpense;

        // Total Aset = Kas + Piutang
        const totalAset = kas + totalPiutang;

        // Kewajiban = 0 (belum ada modul hutang)
        const totalKewajiban = 0;

        // Modal = Total Aset - Kewajiban
        const totalModal = totalAset - totalKewajiban;

        // Laba bersih = pemasukan - pengeluaran
        const laba = totalIncome - totalExpense;

        res.json({
            aset: {
                kas,
                piutang: totalPiutang,
                total: totalAset
            },
            kewajiban: {
                hutang: 0,
                total: totalKewajiban
            },
            modal: {
                laba,
                total: totalModal
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNeraca };