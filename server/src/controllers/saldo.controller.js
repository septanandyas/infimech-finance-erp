const db = require('../utils/db');

const getSaldo = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year || new Date().getFullYear();
        const months = [];
        for (let m = 1; m <= 12; m++) {
            const [rows] = await db.query(`
                SELECT 
                    SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
                    SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
                FROM Cashflow
                WHERE MONTH(date) = ? AND YEAR(date) = ?
            `, [m, targetYear]);
            months.push({
                month: m,
                income: rows[0].income || 0,
                expense: rows[0].expense || 0,
                net: (rows[0].income || 0) - (rows[0].expense || 0)
            });
        }

        // Kumulatif saldo
        let runningBalance = 0;
        months.forEach(m => {
            runningBalance += m.net;
            m.balance = runningBalance;
        });

        res.json(months);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSaldo };