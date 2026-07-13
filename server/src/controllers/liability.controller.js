const db = require('../utils/db');

const getLiabilities = async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT l.*, u.username as createdByName
            FROM Liability l
            JOIN User u ON l.createdBy = u.id
            WHERE 1=1
        `;
        const params = [];
        if (status) { sql += ' AND l.status = ?'; params.push(status); }
        sql += ' ORDER BY l.due_date ASC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createLiability = async (req, res) => {
    try {
        const { name, category, amount, start_date, due_date, term_type, status, notes } = req.body;
        const [result] = await db.query(
            'INSERT INTO Liability (name, category, amount, start_date, due_date, term_type, status, notes, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [name, category, amount, start_date, due_date, term_type, status || 'outstanding', notes || null, req.userId]
        );
        res.json({ id: result.insertId, message: 'Created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLiability = async (req, res) => {
    try {
        const { name, category, amount, start_date, due_date, term_type, status, notes } = req.body;
        await db.query(
            'UPDATE Liability SET name=?, category=?, amount=?, start_date=?, due_date=?, term_type=?, status=?, notes=?, updatedAt=NOW() WHERE id=?',
            [name, category, amount, start_date, due_date, term_type, status, notes || null, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteLiability = async (req, res) => {
    try {
        await db.query('DELETE FROM Liability WHERE id=?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLiabilities, createLiability, updateLiability, deleteLiability };
