const db = require('../utils/db');

const getInventory = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Inventory ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createInventory = async (req, res) => {
    try {
        const { name, category, unit, unit_price, notes } = req.body;
        // quantity SENGAJA diset 0 di sini. Qty riil ditetapkan oleh
        // createInventoryLog yang dipanggil frontend setelah item dibuat,
        // supaya tidak terhitung dobel.
        const [result] = await db.query(
            'INSERT INTO Inventory (name, category, quantity, unit, unit_price, total_value, notes, createdBy, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?, 0, ?, ?, NOW(), NOW())',
            [name, category, unit, unit_price, notes || null, req.userId]
        );
        res.json({ id: result.insertId, message: 'Created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateInventory = async (req, res) => {
    try {
        const { name, category, unit, unit_price, notes } = req.body;
        const [current] = await db.query('SELECT quantity FROM Inventory WHERE id = ?', [req.params.id]);
        const total_value = current[0].quantity * unit_price;
        await db.query(
            'UPDATE Inventory SET name=?, category=?, unit=?, unit_price=?, total_value=?, notes=?, updatedAt=NOW() WHERE id=?',
            [name, category, unit, unit_price, total_value, notes || null, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteInventory = async (req, res) => {
    try {
        await db.query('DELETE FROM Inventory WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInventoryLog = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT l.*, u.username as createdByName
            FROM InventoryLog l
            LEFT JOIN User u ON l.createdBy = u.id
            WHERE l.inventoryId = ?
            ORDER BY l.createdAt DESC
        `, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createInventoryLog = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { inventoryId, type, quantity, note, entry_type, log_date } = req.body;
        await conn.beginTransaction();

        const [current] = await conn.query(
            'SELECT i.quantity, i.unit_price, i.name, i.coa_code FROM Inventory i WHERE i.id = ?',
            [inventoryId]
        );
        if (current.length === 0) return res.status(404).json({ message: 'Item not found' });

        const currentQty = Number(current[0].quantity);
        const newQty = type === 'in'
            ? currentQty + Number(quantity)
            : currentQty - Number(quantity);

        if (newQty < 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'Stok tidak cukup' });
        }

        const total_value = newQty * Number(current[0].unit_price);
        const totalCost = Number(quantity) * Number(current[0].unit_price);
        const coaCode = current[0].coa_code || '1350';
        const itemName = current[0].name;
        const entryType = entry_type || 'purchase';
        const entryDate = log_date || new Date().toISOString().slice(0, 10);

        // Update stok
        await conn.query(
            'UPDATE Inventory SET quantity=?, total_value=?, updatedAt=NOW() WHERE id=?',
            [newQty, total_value, inventoryId]
        );

        // Catat log
        await conn.query(
            'INSERT INTO InventoryLog (inventoryId, type, quantity, note, entry_type, log_date, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [inventoryId, type, quantity, note || null, entryType, entryDate, req.userId]
        );

        // Catat ke Journal jika barang keluar karena rusak/disposal
        if (type === 'out' && (entryType === 'disposal' || entryType === 'adjustment')) {
            const [journal] = await conn.query(
                `INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
         VALUES (?, ?, ?, 'inventory_disposal', ?, ?, NOW())`,
                [
                    entryDate,
                    `${entryType === 'disposal' ? 'Disposal' : 'Penyesuaian'} persediaan - ${itemName}`,
                    `INV-${Date.now()}`,
                    new Date(entryDate).getMonth() + 1,
                    new Date(entryDate).getFullYear()
                ]
            );
            await conn.query(
                `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
                [[
                    [journal.insertId, '6500', `Beban perlengkapan - ${itemName} (${quantity} unit)`, totalCost, 0],
                    [journal.insertId, coaCode, `Persediaan keluar - ${itemName} (${quantity} unit)`, 0, totalCost]
                ]]
            );
        }

        // Catat ke Cashflow HANYA jika barang masuk DAN tipe pembelian baru
        if (type === 'in' && entryType === 'purchase') {
            await conn.query(
                `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, createdBy, createdAt, updatedAt)
                 VALUES ('expense', 'Persediaan ATK & Perlengkapan', ?, ?, ?, ?, ?, NOW(), NOW())`,
                [coaCode, totalCost, `Pembelian ${itemName} (${quantity} unit)`, entryDate, req.userId]
            );
        }

        await conn.commit();
        res.json({
            message: 'Log created',
            newQuantity: newQty,
            cashflow_recorded: type === 'in' && entryType === 'purchase'
        });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

module.exports = { getInventory, createInventory, updateInventory, deleteInventory, getInventoryLog, createInventoryLog };