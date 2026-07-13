const db = require('../utils/db');

const getCashflow = async (req, res) => {
    try {
        const { month, year, type } = req.query;
        let sql = `
            SELECT c.*, u.username as createdByName,
                   p.name_project as projectName,
                   coa.name as coa_name
            FROM Cashflow c
            JOIN User u ON c.createdBy = u.id
            LEFT JOIN Prospect p ON c.projectId = p.no_project
            LEFT JOIN ChartOfAccount coa ON c.coa_code = coa.code
            WHERE 1=1
        `;
        const params = [];
        if (month && year) {
            sql += ' AND MONTH(c.date) = ? AND YEAR(c.date) = ?';
            params.push(month, year);
        }
        if (type) {
            sql += ' AND c.type = ?';
            params.push(type);
        }
        sql += ' ORDER BY c.date DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCashflow = async (req, res) => {
    try {
        const { type, category, amount, description, date, projectId, coa_code } = req.body;
        const [result] = await db.query(
            'INSERT INTO Cashflow (type, category, amount, description, date, projectId, createdBy, coa_code, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [type, category, amount, description, date, projectId || null, req.userId, coa_code || null]
        );
        const [newRow] = await db.query('SELECT * FROM Cashflow WHERE id = ?', [result.insertId]);
        res.json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCashflow = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, category, amount, description, date, projectId, coa_code } = req.body;
        await db.query(
            'UPDATE Cashflow SET type=?, category=?, amount=?, description=?, date=?, projectId=?, coa_code=?, updatedAt=NOW() WHERE id=?',
            [type, category, amount, description, date, projectId || null, coa_code || null, id]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteCashflow = async (req, res) => {
    try {
        await db.query('DELETE FROM Cashflow WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCashflowSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        const [rows] = await db.query(`
            SELECT 
                SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as totalIncome,
                SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as totalExpense,
                SUM(CASE WHEN type='income' THEN amount ELSE -amount END) as netCashflow
            FROM Cashflow
            WHERE MONTH(date) = ? AND YEAR(date) = ?
        `, [month, year]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCashflow, createCashflow, updateCashflow, deleteCashflow, getCashflowSummary };