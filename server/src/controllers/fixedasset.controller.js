const db = require('../utils/db');

const getFixedAssets = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, u.username as createdByName
            FROM FixedAsset f
            JOIN User u ON f.createdBy = u.id
            ORDER BY f.acquisition_date DESC
        `);
        // Hitung nilai buku per aset
        const today = new Date();
        const result = rows.map(asset => {
            const acquired = new Date(asset.acquisition_date);
            const monthsElapsed = (today.getFullYear() - acquired.getFullYear()) * 12 + (today.getMonth() - acquired.getMonth());
            const totalMonths = asset.useful_life_years * 12;
            const monthlyDepreciation = asset.acquisition_value / totalMonths;
            const accumulated = Math.min(monthlyDepreciation * monthsElapsed, asset.acquisition_value);
            const book_value = Math.max(asset.acquisition_value - accumulated, 0);
            return { ...asset, accumulated_depreciation: accumulated, book_value };
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createFixedAsset = async (req, res) => {
    try {
        const { name, category, acquisition_value, acquisition_date, useful_life_years, notes } = req.body;
        const [result] = await db.query(
            'INSERT INTO FixedAsset (name, category, acquisition_value, acquisition_date, useful_life_years, notes, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [name, category, acquisition_value, acquisition_date, useful_life_years || 4, notes || null, req.userId]
        );
        res.json({ id: result.insertId, message: 'Created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateFixedAsset = async (req, res) => {
    try {
        const { name, category, acquisition_value, acquisition_date, useful_life_years, notes } = req.body;
        await db.query(
            'UPDATE FixedAsset SET name=?, category=?, acquisition_value=?, acquisition_date=?, useful_life_years=?, notes=?, updatedAt=NOW() WHERE id=?',
            [name, category, acquisition_value, acquisition_date, useful_life_years, notes || null, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteFixedAsset = async (req, res) => {
    try {
        await db.query('DELETE FROM FixedAsset WHERE id=?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getFixedAssets, createFixedAsset, updateFixedAsset, deleteFixedAsset };