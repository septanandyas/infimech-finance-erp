const db = require('../utils/db');

const getLiabilities = async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT l.*, u.username as createdByName,
                   f.name as asset_name
            FROM Liability l
            JOIN User u ON l.createdBy = u.id
            LEFT JOIN FixedAsset f ON l.linked_asset_id = f.id
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
    const conn = await db.getConnection();
    try {
        const { name, category, coa_code, amount, start_date, due_date, term_type, status, notes, create_asset, asset_name, asset_category, asset_useful_life } = req.body;
        await conn.beginTransaction();

        let linked_asset_id = null;

        // Kalau pembelian aset secara kredit, otomatis buat aset tetap
        if (create_asset && asset_name) {
            const [assetResult] = await conn.query(
                `INSERT INTO FixedAsset (name, category, acquisition_value, salvage_value, acquisition_date, useful_life_years, notes, createdBy, createdAt, updatedAt)
                 VALUES (?, ?, ?, 0, ?, ?, ?, ?, NOW(), NOW())`,
                [asset_name, asset_category || 'Lainnya', amount, start_date, asset_useful_life || 4, `Dibeli kredit - ${name}`, req.userId]
            );
            linked_asset_id = assetResult.insertId;

            // Catat jurnal: Debit Aset Tetap, Kredit Hutang
            const assetCoaCode = {
                'Peralatan IT': '1400',
                'Mesin': '1400',
                'Kendaraan': '1410',
                'Furniture': '1420',
                'Bangunan': '1430',
                'Lainnya': '1400'
            }[asset_category] || '1400';
            const liabilityCoaCode = coa_code || '2100';
            const [journal] = await conn.query(
                `INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
     VALUES (?, ?, ?, 'liability_purchase', ?, ?, NOW())`,
                [start_date, `Pembelian ${asset_name} secara kredit`, `LB-${Date.now()}`, new Date(start_date).getMonth() + 1, new Date(start_date).getFullYear()]
            );
            await conn.query(
                `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
                [[
                    [journal.insertId, assetCoaCode, `Pembelian aset - ${asset_name}`, amount, 0],
                    [journal.insertId, liabilityCoaCode, `Hutang pembelian - ${asset_name}`, 0, amount]
                ]]
            );
        }

        const [result] = await conn.query(
            `INSERT INTO Liability (name, category, coa_code, linked_asset_id, amount, start_date, due_date, term_type, status, notes, createdBy, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [name, category, coa_code || null, linked_asset_id, amount, start_date, due_date, term_type, status || 'outstanding', notes || null, req.userId]
        );

        await conn.commit();
        res.json({ id: result.insertId, message: 'Created', linked_asset_id });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

const updateLiability = async (req, res) => {
    try {
        const { name, category, coa_code, amount, start_date, due_date, term_type, status, notes } = req.body;
        await db.query(
            'UPDATE Liability SET name=?, category=?, coa_code=?, amount=?, start_date=?, due_date=?, term_type=?, status=?, notes=?, updatedAt=NOW() WHERE id=?',
            [name, category, coa_code || null, amount, start_date, due_date, term_type, status, notes || null, req.params.id]
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

const addLiabilityPayment = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { id } = req.params;
        const { amount, payment_date, notes } = req.body;
        await conn.beginTransaction();

        const [liabilities] = await conn.query('SELECT * FROM Liability WHERE id = ?', [id]);
        if (liabilities.length === 0) return res.status(404).json({ message: 'Kewajiban tidak ditemukan' });
        const liability = liabilities[0];

        const newPaidAmount = Number(liability.paid_amount) + Number(amount);
        if (newPaidAmount > Number(liability.amount)) {
            await conn.rollback();
            return res.status(400).json({ message: 'Jumlah pembayaran melebihi total kewajiban' });
        }

        // Catat cicilan
        await conn.query(
            `INSERT INTO LiabilityPayment (liabilityId, amount, payment_date, notes, createdBy, createdAt)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [id, amount, payment_date, notes || null, req.userId]
        );

        // Update paid_amount dan status
        const newStatus = newPaidAmount >= Number(liability.amount) ? 'settled' : 'outstanding';
        await conn.query(
            'UPDATE Liability SET paid_amount=?, status=?, updatedAt=NOW() WHERE id=?',
            [newPaidAmount, newStatus, id]
        );

        // Catat ke Cashflow sebagai pengeluaran kas (akun KAS 1100, bukan akun hutangnya)
        await conn.query(
            `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, createdBy, createdAt, updatedAt)
             VALUES ('expense', ?, '1100', ?, ?, ?, ?, NOW(), NOW())`,
            [
                liability.category,
                amount,
                `Cicilan ${liability.name} - ${payment_date}`,
                payment_date,
                req.userId
            ]
        );

        // Catat jurnal: Debit Hutang, Kredit Kas
        const [journal] = await conn.query(
            `INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
             VALUES (?, ?, ?, 'liability_payment', ?, ?, NOW())`,
            [payment_date, `Cicilan ${liability.name}`, `LP-${Date.now()}`, new Date(payment_date).getMonth() + 1, new Date(payment_date).getFullYear()]
        );
        await conn.query(
            `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
            [[
                [journal.insertId, liability.coa_code || '2100', `Pelunasan hutang - ${liability.name}`, amount, 0],
                [journal.insertId, '1100', `Kas keluar cicilan - ${liability.name}`, 0, amount]
            ]]
        );

        await conn.commit();
        res.json({ message: 'Cicilan dicatat', newStatus, newPaidAmount });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

const getLiabilityPayments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, u.username as createdByName
            FROM LiabilityPayment p
            JOIN User u ON p.createdBy = u.id
            WHERE p.liabilityId = ?
            ORDER BY p.payment_date ASC
        `, [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteLiabilityPayment = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { id, paymentId } = req.params;
        await conn.beginTransaction();

        // Ambil data payment
        const [payments] = await conn.query('SELECT * FROM LiabilityPayment WHERE id = ? AND liabilityId = ?', [paymentId, id]);
        if (payments.length === 0) return res.status(404).json({ message: 'Cicilan tidak ditemukan' });
        const payment = payments[0];

        // Ambil liability
        const [liabilities] = await conn.query('SELECT * FROM Liability WHERE id = ?', [id]);
        if (liabilities.length === 0) return res.status(404).json({ message: 'Kewajiban tidak ditemukan' });
        const liability = liabilities[0];

        // Hapus payment
        await conn.query('DELETE FROM LiabilityPayment WHERE id = ?', [paymentId]);

        // Recalculate paid_amount
        const [remaining] = await conn.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM LiabilityPayment WHERE liabilityId = ?', [id]
        );
        const newPaidAmount = Number(remaining[0].total);
        const newStatus = newPaidAmount >= Number(liability.amount) ? 'settled' : 'outstanding';
        await conn.query(
            'UPDATE Liability SET paid_amount=?, status=?, updatedAt=NOW() WHERE id=?',
            [newPaidAmount, newStatus, id]
        );

        // Hapus cashflow terkait
        await conn.query(
            `DELETE FROM Cashflow WHERE description LIKE ? AND amount = ? AND type = 'expense' ORDER BY id DESC LIMIT 1`,
            [`%${liability.name}%`, payment.amount]
        );

        // Hapus jurnal terkait
        await conn.query(
            `DELETE je FROM JournalEntry je
             JOIN Journal j ON je.journalId = j.id
             WHERE j.type = 'liability_payment'
             AND j.period_month = MONTH(?) AND j.period_year = YEAR(?)
             AND je.debit = ? OR je.credit = ?`,
            [payment.payment_date, payment.payment_date, payment.amount, payment.amount]
        );
        await conn.query(
            `DELETE FROM Journal WHERE type='liability_payment' 
             AND period_month = MONTH(?) AND period_year = YEAR(?)
             AND id NOT IN (SELECT DISTINCT journalId FROM JournalEntry)`,
            [payment.payment_date, payment.payment_date]
        );

        await conn.commit();
        res.json({ message: 'Cicilan dihapus', newPaidAmount, newStatus });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

module.exports = { getLiabilities, createLiability, updateLiability, deleteLiability, addLiabilityPayment, getLiabilityPayments, deleteLiabilityPayment };