const db = require('../utils/db');

const getUnearnedRevenues = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.*, 
                i.invoice_number, i.status as invoice_status,
                p.name_project as projectName,
                usr.username as createdByName
            FROM UnearnedRevenue u
            JOIN Invoice i ON u.invoiceId = i.id
            JOIN Prospect p ON u.projectId = p.no_project
            JOIN User usr ON u.createdBy = usr.id
            ORDER BY u.received_date DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createUnearnedRevenue = async (req, res) => {
    try {
        const { invoiceId, projectId, amount, category, received_date, notes } = req.body;
        const [result] = await db.query(
            `INSERT INTO UnearnedRevenue 
            (invoiceId, projectId, amount, category, received_date, status, notes, createdBy, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
            [invoiceId, projectId, amount, category, received_date, notes || null, req.userId]
        );
        res.json({ id: result.insertId, message: 'Created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUnearnedRevenue = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT status FROM UnearnedRevenue WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        if (rows[0].status === 'recognized') return res.status(400).json({ message: 'Tidak bisa hapus pembayaran yang sudah diakui' });
        await db.query('DELETE FROM UnearnedRevenue WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUnearnedRevenues, createUnearnedRevenue, deleteUnearnedRevenue };