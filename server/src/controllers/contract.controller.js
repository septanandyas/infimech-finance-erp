const db = require('../utils/db');

const getContracts = async (req, res) => {
    try {
        const { projectId } = req.query;
        let sql = `
            SELECT c.*, 
                p.name_project as projectName,
                p.client_name,
                u.username as createdByName,
                COALESCE(SUM(ip.amount / (1 + COALESCE(i.tax_rate, 0) / 100)), 0) as total_paid,
c.contract_value - COALESCE(SUM(ip.amount / (1 + COALESCE(i.tax_rate, 0) / 100)), 0) as outstanding
            FROM ProjectContract c
            JOIN Prospect p ON c.projectId = p.no_project
            JOIN User u ON c.createdBy = u.id
            LEFT JOIN Invoice i ON i.contractId = c.id AND i.status IN ('acc','partial','paid')
            LEFT JOIN InvoicePayment ip ON ip.invoiceId = i.id
            WHERE 1=1
        `;
        const params = [];
        if (projectId) { sql += ' AND c.projectId = ?'; params.push(projectId); }
        sql += ' GROUP BY c.id ORDER BY c.contract_date DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createContract = async (req, res) => {
    try {
        const { projectId, contract_number, contract_value, contract_date, status, notes } = req.body;
        const [result] = await db.query(
            `INSERT INTO ProjectContract (projectId, contract_number, contract_value, contract_date, status, notes, createdBy, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [projectId, contract_number || null, contract_value, contract_date, status || 'active', notes || null, req.userId]
        );
        res.json({ id: result.insertId, message: 'Contract created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateContract = async (req, res) => {
    try {
        const { contract_number, contract_value, contract_date, status, notes } = req.body;
        await db.query(
            `UPDATE ProjectContract SET contract_number=?, contract_value=?, contract_date=?, status=?, notes=?, updatedAt=NOW() WHERE id=?`,
            [contract_number || null, contract_value, contract_date, status, notes || null, req.params.id]
        );
        res.json({ message: 'Contract updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteContract = async (req, res) => {
    try {
        await db.query('DELETE FROM ProjectContract WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getContracts, createContract, updateContract, deleteContract };