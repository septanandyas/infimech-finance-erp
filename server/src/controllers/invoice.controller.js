const db = require('../utils/db');

const determineRevenueCoa = (invoice) => {
    try {
        const items = invoice.items || [];
        const text = (items.map(i => i.description || '').join(' ') + ' ' + (invoice.notes || '')).toLowerCase();
        if (text.includes('cfd')) return '4100';
        if (text.includes('fea')) return '4200';
        if (text.includes('konsult') || text.includes('training') || text.includes('consult')) return '4300';
        // Fallback to general pendapatan jasa
        return '4100';
    } catch (err) {
        return '4100';
    }
};

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
        const { doc_type, rev_number, rev_version, projectId, contractId, client_name, amount, tax, tax_label, tax_rate, total, due_date, notes, payment_terms, items } = req.body;
        await conn.beginTransaction();
        const invoice_number = await getNextInvoiceNumber(conn, doc_type || 'INV', rev_number || '1', rev_version || 'A');
        const [result] = await conn.query(
            'INSERT INTO Invoice (invoice_number, projectId, contractId, client_name, amount, tax, tax_label, tax_rate, total, due_date, notes, createdBy, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
            [invoice_number, projectId || null, contractId || null, client_name, amount, tax || 0, tax_label || 'PPN', tax_rate || 0, total, due_date, notes, req.userId]
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
        const { invoice_number, projectId, contractId, client_name, amount, tax, tax_label, tax_rate, total, due_date, notes, payment_terms, items } = req.body;
        await conn.beginTransaction();
        await conn.query(
            'UPDATE Invoice SET invoice_number=?, projectId=?, contractId=?, client_name=?, amount=?, tax=?, tax_label=?, tax_rate=?, total=?, due_date=?, notes=?, payment_terms=?, updatedAt=NOW() WHERE id=?',
            [invoice_number, projectId || null, contractId || null, client_name, amount, tax || 0, tax_label || 'PPN', tax_rate || 0, total, due_date, notes, payment_terms, id]
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
    const conn = await db.getConnection();
    try {
        const { status, paid_date } = req.body;
        const invoiceId = req.params.id;
        await conn.beginTransaction();

        const updates = ['status=?', 'updatedAt=NOW()'];
        const params = [status];

        if (status === 'acc') updates.push('acc_date=NOW()');
        if (paid_date) { updates.push('paid_date=?'); params.push(paid_date); }
        params.push(invoiceId);

        await conn.query(`UPDATE Invoice SET ${updates.join(', ')} WHERE id=?`, params);

        await conn.commit();
        res.json({ message: 'Status updated' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
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

const addPayment = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { id } = req.params;
        const { amount, payment_date, payment_type, notes } = req.body;

        await conn.beginTransaction();

        // Ambil data invoice
        const [invoices] = await conn.query('SELECT * FROM Invoice WHERE id = ?', [id]);
        if (invoices.length === 0) return res.status(404).json({ message: 'Invoice not found' });
        const invoice = invoices[0];

        // Validasi jumlah pembayaran
        const newPaidAmount = Number(invoice.paid_amount) + Number(amount);
        if (newPaidAmount > Number(invoice.total)) {
            await conn.rollback();
            return res.status(400).json({ message: 'Jumlah pembayaran melebihi total invoice' });
        }

        // Catat pembayaran
        await conn.query(
            'INSERT INTO InvoicePayment (invoiceId, amount, payment_date, payment_type, notes, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [id, amount, payment_date, payment_type, notes || null, req.userId]
        );

        // Update paid_amount dan status invoice
        const newStatus = newPaidAmount >= Number(invoice.total) ? 'paid' : 'partial';
        const paidDate = newStatus === 'paid' ? payment_date : null;

        await conn.query(
            'UPDATE Invoice SET paid_amount=?, status=?, paid_date=?, updatedAt=NOW() WHERE id=?',
            [newPaidAmount, newStatus, paidDate, id]
        );

        // load invoice items for COA determination
        const [invItems2] = await conn.query('SELECT * FROM InvoiceItem WHERE invoiceId = ?', [id]);
        invoice.items = invItems2;
        const categoryLabel = payment_type === 'dp' ? 'Down Payment' : payment_type === 'termin' ? 'Pembayaran Termin' : 'Pelunasan';

        // Hitung nilai sebelum pajak dan nilai pajak
        const taxRate = Number(invoice.tax_rate) || 0;
        const amountBeforeTax = taxRate > 0 ? Number(amount) / (1 + taxRate / 100) : Number(amount);
        const taxAmount = Number(amount) - amountBeforeTax;
        console.log('tax_rate:', invoice.tax_rate, 'taxRate:', taxRate, 'amount:', amount, 'amountBeforeTax:', amountBeforeTax, 'taxAmount:', taxAmount);

        // Catat kas masuk ke akun 2200 (nilai sebelum pajak)
        await conn.query(
            `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, projectId, createdBy, createdAt, updatedAt)
     VALUES ('income', ?, '2200', ?, ?, ?, ?, ?, NOW(), NOW())`,
            [categoryLabel, amountBeforeTax, `Pembayaran ${payment_type.toUpperCase()} Invoice ${invoice.invoice_number}`, payment_date, invoice.projectId, req.userId]
        );

        // Catat hutang PPN ke akun 2400 (kalau ada pajak)
        if (taxAmount > 0) {
            await conn.query(
                `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, projectId, createdBy, createdAt, updatedAt)
     VALUES ('income', 'Hutang PPN', '2400', ?, ?, ?, ?, ?, NOW(), NOW())`,
                [taxAmount, `PPN ${invoice.tax_rate}% Invoice ${invoice.invoice_number}`, payment_date, invoice.projectId, req.userId]
            );
        }

        // Kalau lunas, recognize revenue: pindah 2200 -> 4100
        if (newStatus === 'paid') {
            await conn.query(
                'UPDATE Invoice SET recognition_date=?, updatedAt=NOW() WHERE id=?',
                [payment_date, id]
            );

            // Cek apakah semua invoice dalam kontrak sudah paid
            if (invoice.contractId) {
                const [unpaidInvoices] = await conn.query(
                    `SELECT COUNT(*) as count FROM Invoice 
             WHERE contractId = ? AND status != 'paid' AND id != ?`,
                    [invoice.contractId, id]
                );
                // Ambil data kontrak dulu
                const [contract] = await conn.query(
                    'SELECT * FROM ProjectContract WHERE id = ?',
                    [invoice.contractId]
                );

                if (contract.length > 0) {
                    // Hitung total terbayar sebelum pajak untuk seluruh kontrak
                    const [paidSummary] = await conn.query(
                        `SELECT COALESCE(SUM(ip.amount / (1 + COALESCE(inv.tax_rate, 0) / 100)), 0) as total_paid
         FROM InvoicePayment ip
         JOIN Invoice inv ON ip.invoiceId = inv.id
         WHERE inv.contractId = ?`,
                        [invoice.contractId]
                    );
                    const totalPaidBeforeTax = Number(paidSummary[0].total_paid);
                    const contractValue = Number(contract[0].contract_value);
                    const contractFullyPaid = unpaidInvoices[0].count === 0 && Math.abs(totalPaidBeforeTax - contractValue) < 1;

                    if (contractFullyPaid) {
                        // Semua invoice lunas DAN total terbayar = nilai kontrak — akui pendapatan
                        await conn.query(
                            `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, projectId, createdBy, createdAt, updatedAt)
             VALUES ('income', 'Pendapatan Jasa', '4100', ?, ?, ?, ?, ?, NOW(), NOW())`,
                            [
                                contractValue,
                                `Pendapatan diakui - Kontrak ${contract[0].contract_number || invoice.contractId} selesai`,
                                payment_date,
                                invoice.projectId,
                                req.userId
                            ]
                        );
                        await conn.query(
                            'UPDATE ProjectContract SET status=?, updatedAt=NOW() WHERE id=?',
                            ['completed', invoice.contractId]
                        );
                    }
                }
            }
        }

        await conn.commit();
        res.json({ message: 'Pembayaran berhasil dicatat', newStatus, newPaidAmount });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

const getPayments = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT p.*, u.username as createdByName
            FROM InvoicePayment p
            JOIN User u ON p.createdBy = u.id
            WHERE p.invoiceId = ?
            ORDER BY p.payment_date ASC
        `, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePayment = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { id, paymentId } = req.params;
        const { amount, payment_date, payment_type, notes } = req.body;
        await conn.beginTransaction();

        // Ambil data payment lama
        const [oldPayments] = await conn.query('SELECT * FROM InvoicePayment WHERE id = ? AND invoiceId = ?', [paymentId, id]);
        if (oldPayments.length === 0) return res.status(404).json({ message: 'Payment not found' });
        const oldPayment = oldPayments[0];

        // Ambil invoice
        const [invoices] = await conn.query('SELECT * FROM Invoice WHERE id = ?', [id]);
        if (invoices.length === 0) return res.status(404).json({ message: 'Invoice not found' });
        const invoice = invoices[0];

        // Hitung paid_amount baru
        const newPaidAmount = Number(invoice.paid_amount) - Number(oldPayment.amount) + Number(amount);
        if (newPaidAmount > Number(invoice.total)) {
            await conn.rollback();
            return res.status(400).json({ message: 'Jumlah pembayaran melebihi total invoice' });
        }

        // Update payment
        await conn.query(
            'UPDATE InvoicePayment SET amount=?, payment_date=?, payment_type=?, notes=? WHERE id=?',
            [amount, payment_date, payment_type, notes || null, paymentId]
        );

        // Update paid_amount dan status invoice
        const newStatus = newPaidAmount >= Number(invoice.total) ? 'paid' : newPaidAmount > 0 ? 'partial' : 'acc';
        console.log('newPaidAmount:', newPaidAmount, typeof newPaidAmount, 'invoice.total:', Number(invoice.total), typeof invoice.total, 'newStatus:', newStatus);
        await conn.query(
            'UPDATE Invoice SET paid_amount=?, status=?, paid_date=?, updatedAt=NOW() WHERE id=?',
            [newPaidAmount, newStatus, newStatus === 'paid' ? payment_date : null, id]
        );

        // Update cashflow terkait
        const categoryLabel = payment_type === 'dp' ? 'Down Payment' : payment_type === 'termin' ? 'Pembayaran Termin' : 'Pelunasan';
        await conn.query(
            `UPDATE Cashflow SET amount=?, category=?, date=?, description=?, updatedAt=NOW()
             WHERE description LIKE ? AND coa_code='2200' AND type='income'
             ORDER BY id DESC LIMIT 1`,
            [amount, categoryLabel, payment_date, `Pembayaran ${payment_type.toUpperCase()} Invoice ${invoice.invoice_number}`,
                `%Invoice ${invoice.invoice_number}%`]
        );

        await conn.commit();
        res.json({ message: 'Payment updated', newStatus, newPaidAmount });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

const deletePayment = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { id, paymentId } = req.params;
        await conn.beginTransaction();

        const [payments] = await conn.query('SELECT * FROM InvoicePayment WHERE id = ? AND invoiceId = ?', [paymentId, id]);
        if (payments.length === 0) return res.status(404).json({ message: 'Payment not found' });
        const payment = payments[0];

        const [invoices] = await conn.query('SELECT * FROM Invoice WHERE id = ?', [id]);
        if (invoices.length === 0) return res.status(404).json({ message: 'Invoice not found' });
        const invoice = invoices[0];

        // Hapus payment
        await conn.query('DELETE FROM InvoicePayment WHERE id = ?', [paymentId]);

        // Recalculate paid_amount dari semua payment yang tersisa
        const [remaining] = await conn.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM InvoicePayment WHERE invoiceId = ?', [id]
        );
        const newPaidAmount = Number(remaining[0].total);
        const newStatus = newPaidAmount >= Number(invoice.total) ? 'paid' : newPaidAmount > 0 ? 'partial' : 'acc';

        await conn.query(
            'UPDATE Invoice SET paid_amount=?, status=?, paid_date=?, updatedAt=NOW() WHERE id=?',
            [newPaidAmount, newStatus, newStatus === 'paid' ? invoice.paid_date : null, id]
        );

        // Hapus cashflow terkait
        await conn.query(
            `DELETE FROM Cashflow WHERE description LIKE ? AND amount=? AND coa_code='2200' AND type='income' ORDER BY id DESC LIMIT 1`,
            [`%Invoice ${invoice.invoice_number}%`, payment.amount]
        );

        await conn.commit();
        res.json({ message: 'Payment deleted', newStatus, newPaidAmount });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

module.exports = { getInvoices, createInvoice, getInvoiceById, updateInvoice, updateInvoiceStatus, deleteInvoice, getProspects, addPayment, getPayments, updatePayment, deletePayment };