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
        const { name, category, quantity, unit, unit_price } = req.body;
        const total_value = quantity * unit_price;
        const [result] = await db.query(
            'INSERT INTO Inventory (name, category, quantity, unit, unit_price, total_value, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [name, category, quantity, unit, unit_price, total_value]
        );
        res.json({ id: result.insertId, message: 'Created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateInventory = async (req, res) => {
    try {
        const { name, category, unit, unit_price } = req.body;
        const [current] = await db.query('SELECT quantity FROM Inventory WHERE id = ?', [req.params.id]);
        const total_value = current[0].quantity * unit_price;
        await db.query(
            'UPDATE Inventory SET name=?, category=?, unit=?, unit_price=?, total_value=?, updatedAt=NOW() WHERE id=?',
            [name, category, unit, unit_price, total_value, req.params.id]
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
            JOIN User u ON l.createdBy = u.id
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
        const { inventoryId, type, quantity, note } = req.body;
        await conn.beginTransaction();

        const [current] = await conn.query('SELECT quantity, unit_price FROM Inventory WHERE id = ?', [inventoryId]);
        if (current.length === 0) return res.status(404).json({ message: 'Item not found' });

        const currentQty = Number(current[0].quantity);
        const newQty = type === 'in' ? currentQty + Number(quantity) : currentQty - Number(quantity);

        if (newQty < 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'Stok tidak cukup' });
        }

        const total_value = newQty * Number(current[0].unit_price);

        await conn.query(
            'UPDATE Inventory SET quantity=?, total_value=?, updatedAt=NOW() WHERE id=?',
            [newQty, total_value, inventoryId]
        );

        await conn.query(
            'INSERT INTO InventoryLog (inventoryId, type, quantity, note, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
            [inventoryId, type, quantity, note || null, req.userId]
        );

        await conn.commit();
        res.json({ message: 'Log created', newQuantity: newQty });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

module.exports = { getInventory, createInventory, updateInventory, deleteInventory, getInventoryLog, createInventoryLog };