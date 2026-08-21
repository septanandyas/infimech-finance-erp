const db = require('../utils/db');

const determineRevenueCoa = (projectName) => {
    const name = (projectName || '').toLowerCase();
    if (name.includes('fea')) return '4200';       // Pendapatan Jasa Simulasi FEA
    if (name.includes('training') || name.includes('konsultasi')) return '4300';
    return '4100'; // default: Pendapatan Jasa Simulasi CFD
};

const determineTaxCoa = (taxLabel) => {
    if (!taxLabel) return '2400';
    const label = taxLabel.toLowerCase();
    if (label.includes('pph final')) return '6400'; // Beban Pajak PPh Final
    if (label.includes('pph')) return '2500';        // Utang PPh 23 (sudah ada di COA Anda)
    return '2400'; // Utang PPN
};

const determineTaxCategory = (taxLabel) => {
    if (!taxLabel) return 'Utang PPN';
    const label = taxLabel.toLowerCase();
    if (label.includes('pph final')) return 'Beban Pajak PPh Final';
    if (label.includes('pph')) return 'Hutang Pajak PPh 23';
    return 'Utang PPN';
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
    const conn = await db.getConnection();
    try {
        const invoiceId = req.params.id;
        await conn.beginTransaction();

        // Ambil semua paymentId yang terikat dengan invoice ini
        const [payments] = await conn.query('SELECT id FROM InvoicePayment WHERE invoiceId = ?', [invoiceId]);
        
        if (payments.length > 0) {
            const paymentIds = payments.map(p => p.id);
            const placeholders = paymentIds.map(() => '?').join(',');

            // 1. Hapus Cashflow terkait
            await conn.query(`DELETE FROM Cashflow WHERE paymentId IN (${placeholders})`, paymentIds);

            // 2. Hapus Jurnal PY-xxx (pengurangan piutang) terkait
            for (const pid of paymentIds) {
                const [pyJournals] = await conn.query(`SELECT id FROM Journal WHERE reference = ?`, [`PY-${pid}`]);
                if (pyJournals.length > 0) {
                    const pyIds = pyJournals.map(j => j.id);
                    const pyHolders = pyIds.map(() => '?').join(',');
                    await conn.query(`DELETE FROM JournalEntry WHERE journalId IN (${pyHolders})`, pyIds);
                    await conn.query(`DELETE FROM Journal WHERE id IN (${pyHolders})`, pyIds);
                }
            }

            // 3. Hapus InvoicePayment
            await conn.query(`DELETE FROM InvoicePayment WHERE invoiceId = ?`, [invoiceId]);
        }

        // Ambil data invoice untuk cek contractId & status pelunasan
        const [invoices] = await conn.query('SELECT contractId FROM Invoice WHERE id = ?', [invoiceId]);
        if (invoices.length > 0 && invoices[0].contractId) {
            const contractId = invoices[0].contractId;
            // Hapus Jurnal RR-xxx jika ada
            const [reclassJournals] = await conn.query(
                `SELECT id FROM Journal WHERE type = 'revenue_recognition' AND reference LIKE ?`,
                [`RR-${contractId}-%`]
            );
            if (reclassJournals.length > 0) {
                const rrIds = reclassJournals.map(j => j.id);
                const rrHolders = rrIds.map(() => '?').join(',');
                await conn.query(`DELETE FROM JournalEntry WHERE journalId IN (${rrHolders})`, rrIds);
                await conn.query(`DELETE FROM Journal WHERE id IN (${rrHolders})`, rrIds);
            }
            // Kembalikan status kontrak ke active jika completed
            await conn.query(`UPDATE ProjectContract SET status='active', updatedAt=NOW() WHERE id=? AND status='completed'`, [contractId]);
        }

        // Hapus InvoiceItem & Invoice
        await conn.query('DELETE FROM InvoiceItem WHERE invoiceId = ?', [invoiceId]);
        await conn.query('DELETE FROM Invoice WHERE id = ?', [invoiceId]);

        await conn.commit();
        res.json({ message: 'Invoice and associated payments/journals deleted' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
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
        const [invoices] = await conn.query(
            `SELECT i.*, p.name_project as projectName FROM Invoice i
            LEFT JOIN Prospect p ON i.projectId = p.no_project WHERE i.id = ?`, [id]
        );
        if (invoices.length === 0) return res.status(404).json({ message: 'Invoice not found' });
        const invoice = invoices[0];

        // Validasi jumlah pembayaran
        const newPaidAmount = Number(invoice.paid_amount) + Number(amount);
        if (newPaidAmount > Number(invoice.total)) {
            await conn.rollback();
            return res.status(400).json({ message: 'Jumlah pembayaran melebihi total invoice' });
        }

        // Catat pembayaran
        const [paymentResult] = await conn.query(
            'INSERT INTO InvoicePayment (invoiceId, amount, payment_date, payment_type, notes, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [id, amount, payment_date, payment_type, notes || null, req.userId]
        );
        const newPaymentId = paymentResult.insertId;

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

        // Tentukan COA Cashflow: DP & Termin -> 2200, Pelunasan -> 4100/4200/4300 sesuai kontrak
        let paymentCoa = '2200';
        let contractRevenueCoa = '4100';

        if (invoice.contractId) {
            const [contractRows] = await conn.query('SELECT revenue_coa_code FROM ProjectContract WHERE id = ?', [invoice.contractId]);
            if (contractRows.length > 0 && contractRows[0].revenue_coa_code) {
                contractRevenueCoa = contractRows[0].revenue_coa_code;
            }
        }

        if (payment_type === 'pelunasan') {
            paymentCoa = contractRevenueCoa;
        }

        await conn.query(
            `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, projectId, paymentId, createdBy, createdAt, updatedAt)
     VALUES ('income', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [categoryLabel, paymentCoa, amountBeforeTax, `Pembayaran ${payment_type.toUpperCase()} Invoice ${invoice.invoice_number}`, payment_date, invoice.projectId, newPaymentId, req.userId]
        );

        // Catat pajak ke akun yang sesuai (PPh / PPN)
        if (taxAmount > 0) {
            const taxLabel = invoice.tax_label || 'PPN';
            const taxCoa = determineTaxCoa(taxLabel);
            const taxCat = determineTaxCategory(taxLabel);
            const isPphFinal = taxLabel.toLowerCase().includes('pph final');
            await conn.query(
                `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, projectId, paymentId, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    isPphFinal ? 'expense' : 'income',
                    taxCat,
                    taxCoa,
                    taxAmount,
                    `${taxLabel} ${invoice.tax_rate}% Invoice ${invoice.invoice_number}`,
                    payment_date,
                    invoice.projectId,
                    newPaymentId,
                    req.userId
                ]
            );
        }

        // Catat Jurnal Pengurang Piutang di Buku Besar (Debit 2200, Kredit 1200 Piutang Usaha)
        if (invoice.contractId) {
            const [payJournal] = await conn.query(
                `INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
                 VALUES (?, ?, ?, 'invoice_payment_clearing', ?, ?, NOW())`,
                [
                    payment_date,
                    `Pengurangan piutang Invoice ${invoice.invoice_number}`,
                    `PY-${newPaymentId}`,
                    new Date(payment_date).getMonth() + 1,
                    new Date(payment_date).getFullYear()
                ]
            );
            await conn.query(
                `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
                [[
                    [payJournal.insertId, '2200', `Penyesuaian DP Invoice ${invoice.invoice_number}`, amountBeforeTax, 0],
                    [payJournal.insertId, '1200', `Pengurangan piutang DP Invoice ${invoice.invoice_number}`, 0, amountBeforeTax]
                ]]
            );
        }

        // Kalau lunas, recognize revenue: Pindahkan akumulasi DP/Termin lama di 2200 ke COA Pendapatan Jasa
        if (newStatus === 'paid') {
            await conn.query(
                'UPDATE Invoice SET recognition_date=?, updatedAt=NOW() WHERE id=?',
                [payment_date, id]
            );

            if (invoice.contractId) {
                const [unpaidInvoices] = await conn.query(
                    `SELECT COUNT(*) as count FROM Invoice 
                     WHERE contractId = ? AND status != 'paid' AND id != ?`,
                    [invoice.contractId, id]
                );

                const [contract] = await conn.query(
                    'SELECT * FROM ProjectContract WHERE id = ?',
                    [invoice.contractId]
                );

                if (contract.length > 0) {
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

                    if (contractFullyPaid && payment_type === 'pelunasan') {
                        const revenueCoa = contract[0].revenue_coa_code || '4100';

                        // Hitung berapa total DP/Termin lama yang ada di 2200 untuk kontrak ini (selain pelunasan saat ini)
                        const [dpAccumulated] = await conn.query(
                            `SELECT COALESCE(SUM(c.amount), 0) as total 
                             FROM Cashflow c
                             JOIN InvoicePayment ip ON c.paymentId = ip.id
                             JOIN Invoice inv ON ip.invoiceId = inv.id
                             WHERE inv.contractId = ? AND c.coa_code = '2200' AND c.paymentId != ?`,
                            [invoice.contractId, newPaymentId]
                        );
                        const previousDpAmount = Number(dpAccumulated[0].total);

                        if (previousDpAmount > 0) {
                            const [reclassJournal] = await conn.query(
                                `INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
                                 VALUES (?, ?, ?, 'revenue_recognition', ?, ?, NOW())`,
                                [
                                    payment_date,
                                    `Reklasifikasi DP/Termin ke Pendapatan - Kontrak ${contract[0].contract_number || invoice.contractId} lunas`,
                                    `RR-${invoice.contractId}-${Date.now()}`,
                                    new Date(payment_date).getMonth() + 1,
                                    new Date(payment_date).getFullYear()
                                ]
                            );
                            await conn.query(
                                `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
                                [[
                                    [reclassJournal.insertId, '2200', `Clear DP/Termin lama - Kontrak ${contract[0].contract_number || invoice.contractId}`, previousDpAmount, 0],
                                    [reclassJournal.insertId, revenueCoa, `Pengakuan Pendapatan dari DP lama - Kontrak ${contract[0].contract_number || invoice.contractId}`, 0, previousDpAmount]
                                ]]
                            );
                        }

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

        // Hitung ulang split pajak, SAMA seperti di addPayment
        const taxRate = Number(invoice.tax_rate) || 0;
        const amountBeforeTax = taxRate > 0 ? Number(amount) / (1 + taxRate / 100) : Number(amount);
        const taxAmount = Number(amount) - amountBeforeTax;
        const categoryLabel = payment_type === 'dp' ? 'Down Payment' : payment_type === 'termin' ? 'Pembayaran Termin' : 'Pelunasan';

        // Update baris kas (2200) berdasarkan paymentId -- bukan tebak dari teks
        await conn.query(
            `UPDATE Cashflow SET amount=?, category=?, date=?, description=?, updatedAt=NOW()
             WHERE paymentId=? AND coa_code='2200'`,
            [amountBeforeTax, categoryLabel, payment_date, `Pembayaran ${payment_type.toUpperCase()} Invoice ${invoice.invoice_number}`, paymentId]
        );

        // Update ATAU hapus baris pajak berdasarkan paymentId juga
        if (taxAmount > 0) {
            const taxLabel = invoice.tax_label || 'PPN';
            const taxCoa = determineTaxCoa(taxLabel);
            const taxCat = determineTaxCategory(taxLabel);
            await conn.query(
                `UPDATE Cashflow SET amount=?, category=?, coa_code=?, date=?, description=?, updatedAt=NOW()
                 WHERE paymentId=? AND coa_code != '2200'`,
                [taxAmount, taxCat, taxCoa, payment_date, `${taxLabel} ${invoice.tax_rate}% Invoice ${invoice.invoice_number}`, paymentId]
            );
        } else {
            // Kalau taxAmount sekarang 0 (mis. tax_rate invoice memang 0), hapus baris pajak lama kalau ada
            await conn.query(`DELETE FROM Cashflow WHERE paymentId=? AND coa_code != '2200'`, [paymentId]);
        }

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
        // Hapus SEMUA cashflow terkait payment ini (baris kas 2200 DAN baris pajaknya)
        await conn.query(`DELETE FROM Cashflow WHERE paymentId = ?`, [paymentId]);

        // Hapus Jurnal clearing piutang (PY-xxx) terkait payment ini
        const [pyJournals] = await conn.query(
            `SELECT id FROM Journal WHERE reference = ?`,
            [`PY-${paymentId}`]
        );
        if (pyJournals.length > 0) {
            const pyIds = pyJournals.map(j => j.id);
            const placeholders = pyIds.map(() => '?').join(',');
            await conn.query(`DELETE FROM JournalEntry WHERE journalId IN (${placeholders})`, pyIds);
            await conn.query(`DELETE FROM Journal WHERE id IN (${placeholders})`, pyIds);
        }

        // Kalau ini adalah pembayaran pelunasan, hapus juga Journal reklasifikasi pendapatan
        // (tipe 'revenue_recognition') yang terkait dengan kontrak invoice ini.
        // Ini mencegah double-entry saat invoice pelunasan dibuat ulang.
        if (payment.payment_type === 'pelunasan' && invoice.contractId) {
            const [reclassJournals] = await conn.query(
                `SELECT id FROM Journal WHERE type = 'revenue_recognition' AND reference LIKE ?`,
                [`RR-${invoice.contractId}-%`]
            );
            if (reclassJournals.length > 0) {
                const journalIds = reclassJournals.map(j => j.id);
                const placeholders = journalIds.map(() => '?').join(',');
                await conn.query(`DELETE FROM JournalEntry WHERE journalId IN (${placeholders})`, journalIds);
                await conn.query(`DELETE FROM Journal WHERE id IN (${placeholders})`, journalIds);
            }
            // Kembalikan status kontrak ke 'active' jika sebelumnya 'completed'
            await conn.query(
                `UPDATE ProjectContract SET status='active', updatedAt=NOW() WHERE id=? AND status='completed'`,
                [invoice.contractId]
            );
        }

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