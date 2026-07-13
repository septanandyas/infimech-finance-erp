const db = require('../utils/db');

const getChartOfAccounts = async (req, res) => {
    try {
        const [accounts] = await db.query('SELECT * FROM ChartOfAccount ORDER BY code ASC');
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getChartOfAccounts };
