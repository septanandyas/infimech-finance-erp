const db = require('../utils/db');

const getInvoices = async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT i.*, u.username as createdByName,
                   p.name_project as projectName
            FROM Invoice i
            JOIN User u ON i.createdBy = u.id
            LEFT JOIN Prospect p ON i.projectId = p.no_project
            WHERE 1=1
        `;
        const params = [];
        if (status) { sql += ' AND i.status = ?'; params.push(status); }
        sql += ' ORDER BY i.createdAt DESC';
        const [rows] = await db.query(sql, params);

        // Fetch items per invoice
        const invoiceIds = rows.map(r => r.id);
        if (invoiceIds.length > 0) {
            const placeholders = invoiceIds.map(() => '?').join(',');
            const [items] = await db.query(`SELECT * FROM InvoiceItem WHERE invoiceId IN (${placeholders})`, invoiceIds);
            rows.forEach(inv => {
                inv.items = items.filter(item => item.invoiceId === inv.id);
            });
        }
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getNextInvoiceNumber = async (conn, docType, revNumber, revVersion) => {
    const year = new Date().getFullYear();
    const configKey = `invoice_counter_${year}`;
    const [rows] = await conn.query("SELECT value FROM Config WHERE `key` = ? FOR UPDATE", [configKey]);
    let counter = 1;
    if (rows.length > 0) {
        counter = parseInt(rows[0].value) + 1;
        await conn.query("UPDATE Config SET value = ? WHERE `key` = ?", [counter, configKey]);
    } else {
        await conn.query("INSERT INTO Config (`key`, value) VALUES (?, '1')", [configKey]);
    }
    const urut = String(counter).padStart(3, '0');
    return `IMX-${year}-${docType}-${urut}_INV_${revNumber}_Rev${revVersion}`;
};

const createInvoice = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { doc_type, rev_number, rev_version, projectId, client_name, amount, tax, tax_label, tax_rate, total, due_date, notes, payment_terms, items } = req.body;
        await conn.beginTransaction();
        const invoice_number = await getNextInvoiceNumber(conn, doc_type || 'INV', rev_number || '1', rev_version || 'A');
        const [result] = await conn.query(
            'INSERT INTO Invoice (invoice_number, projectId, client_name, amount, tax, tax_label, tax_rate, total, due_date, notes, createdBy, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
            [invoice_number, projectId || null, client_name, amount, tax || 0, tax_label || 'PPN', tax_rate || 0, total, due_date, notes, req.userId]
        );
        if (items && items.length > 0) {
            const itemValues = items.map(item => [result.insertId, item.description, item.quantity, item.unit_price, item.total]);
            await conn.query('INSERT INTO InvoiceItem (invoiceId, description, quantity, unit_price, total) VALUES ?', [itemValues]);
        }
        await conn.commit();
        res.json({ id: result.insertId, message: 'Invoice created' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

const getInvoiceById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT i.*, u.username as createdByName, p.name_project as projectName
            FROM Invoice i
            JOIN User u ON i.createdBy = u.id
            LEFT JOIN Prospect p ON i.projectId = p.no_project
            WHERE i.id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Invoice not found' });
        const [items] = await db.query('SELECT * FROM InvoiceItem WHERE invoiceId = ?', [req.params.id]);
        rows[0].items = items;
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateInvoice = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { id } = req.params;
        const { invoice_number, projectId, client_name, amount, tax, tax_label, tax_rate, total, due_date, notes, payment_terms, items } = req.body;
        await conn.beginTransaction();
        await conn.query(
            'UPDATE Invoice SET invoice_number=?, projectId=?, client_name=?, amount=?, tax=?, tax_label=?, tax_rate=?, total=?, due_date=?, notes=?, payment_terms=?, updatedAt=NOW() WHERE id=?',
            [invoice_number, projectId || null, client_name, amount, tax || 0, tax_label || 'PPN', tax_rate || 0, total, due_date, notes, payment_terms, id]
        );
        await conn.query('DELETE FROM InvoiceItem WHERE invoiceId = ?', [id]);
        if (items && items.length > 0) {
            const itemValues = items.map(item => [id, item.description, item.quantity, item.unit_price, item.total]);
            await conn.query('INSERT INTO InvoiceItem (invoiceId, description, quantity, unit_price, total) VALUES ?', [itemValues]);
        }
        await conn.commit();
        res.json({ message: 'Invoice updated' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

const updateInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paid_date } = req.body;
        await db.query(
            'UPDATE Invoice SET status=?, paid_date=?, updatedAt=NOW() WHERE id=?',
            [status, paid_date || null, id]
        );
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteInvoice = async (req, res) => {
    try {
        await db.query('DELETE FROM Invoice WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProspects = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT no_project, name_project, client_name FROM Prospect WHERE status = 'WON' ORDER BY createdAt DESC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getInvoices, createInvoice, getInvoiceById, updateInvoice, updateInvoiceStatus, deleteInvoice, getProspects };