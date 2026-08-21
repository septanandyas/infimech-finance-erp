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
    const conn = await db.getConnection();
    try {
        const { projectId, contract_number, contract_value, contract_date, status, notes, revenue_coa_code } = req.body;
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO ProjectContract (projectId, contract_number, contract_value, contract_date, revenue_coa_code, status, notes, createdBy, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [projectId, contract_number || null, contract_value, contract_date, revenue_coa_code || '4100', status || 'active', notes || null, req.userId]
        );
        const contractId = result.insertId;

        // Catat Jurnal Pengakuan Piutang Kontrak Keseluruhan (Debit 1200 Piutang, Kredit 2200 Pendapatan Diterima di Muka)
        const [journal] = await conn.query(
            `INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
             VALUES (?, ?, ?, 'contract_creation', ?, ?, NOW())`,
            [
                contract_date,
                `Pengakuan nilai kontrak - ${contract_number || contractId}`,
                `CTR-${contractId}`,
                new Date(contract_date).getMonth() + 1,
                new Date(contract_date).getFullYear()
            ]
        );

        await conn.query(
            `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
            [[
                [journal.insertId, '1200', `Piutang kontrak - ${contract_number || contractId}`, Number(contract_value), 0],
                [journal.insertId, '2200', `Kewajiban kontrak - ${contract_number || contractId}`, 0, Number(contract_value)]
            ]]
        );

        await conn.commit();
        res.json({ id: contractId, message: 'Contract created' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
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
    const conn = await db.getConnection();
    try {
        const contractId = req.params.id;
        await conn.beginTransaction();

        // Hapus Jurnal CTR-xxx terkait kontrak ini
        const [ctrJournals] = await conn.query(
            `SELECT id FROM Journal WHERE reference = ?`,
            [`CTR-${contractId}`]
        );
        if (ctrJournals.length > 0) {
            const ctrIds = ctrJournals.map(j => j.id);
            const placeholders = ctrIds.map(() => '?').join(',');
            await conn.query(`DELETE FROM JournalEntry WHERE journalId IN (${placeholders})`, ctrIds);
            await conn.query(`DELETE FROM Journal WHERE id IN (${placeholders})`, ctrIds);
        }

        await conn.query('DELETE FROM ProjectContract WHERE id = ?', [contractId]);
        await conn.commit();
        res.json({ message: 'Deleted' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

module.exports = { getContracts, createContract, updateContract, deleteContract };