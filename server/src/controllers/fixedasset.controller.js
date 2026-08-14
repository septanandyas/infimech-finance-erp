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
            if (asset.status === 'disposed') {
                return { ...asset, accumulated_depreciation: 0, book_value: 0, monthly_depreciation: 0 };
            }
            const acquired = new Date(asset.acquisition_date);
            const monthsElapsed = (today.getFullYear() - acquired.getFullYear()) * 12 + (today.getMonth() - acquired.getMonth());
            const totalMonths = asset.useful_life_years * 12;
            const depreciableValue = Number(asset.acquisition_value) - Number(asset.salvage_value || 0);
            const monthlyDepreciation = depreciableValue / totalMonths;
            const accumulated = Math.min(monthlyDepreciation * monthsElapsed, depreciableValue);
            const book_value = Math.max(Number(asset.acquisition_value) - accumulated, Number(asset.salvage_value || 0));
            return { ...asset, accumulated_depreciation: accumulated, book_value, monthly_depreciation: monthlyDepreciation };
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const ASSET_CATEGORY_COA = {
    'Peralatan IT': '1400', 'Mesin': '1400',
    'Kendaraan': '1410', 'Furniture': '1420',
    'Bangunan': '1430', 'Software & Lisensi': '1500',
    'Lainnya': '1400'
};

const createFixedAsset = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { name, category, acquisition_value, salvage_value, acquisition_date, useful_life_years, notes, is_new_purchase } = req.body;
        await conn.beginTransaction();

        const [result] = await conn.query(
            'INSERT INTO FixedAsset (name, category, acquisition_value, salvage_value, acquisition_date, useful_life_years, notes, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [name, category, acquisition_value, salvage_value || 0, acquisition_date, useful_life_years || 4, notes || null, req.userId]
        );

        // Kalau baru dibeli (bukan saldo awal), catat pengeluaran kas
        if (is_new_purchase) {
            const assetCoaCode = ASSET_CATEGORY_COA[category] || '1400';
            await conn.query(
                `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, createdBy, createdAt, updatedAt)
                 VALUES ('expense', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [category, assetCoaCode, acquisition_value, `Pembelian aset tetap - ${name}`, acquisition_date, req.userId]
            );
        }

        await conn.commit();
        res.json({ id: result.insertId, message: 'Created' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

const updateFixedAsset = async (req, res) => {
    try {
        const { name, category, acquisition_value, salvage_value, acquisition_date, useful_life_years, notes } = req.body;
        await db.query(
            'UPDATE FixedAsset SET name=?, category=?, acquisition_value=?, salvage_value=?, acquisition_date=?, useful_life_years=?, notes=?, updatedAt=NOW() WHERE id=?',
            [name, category, acquisition_value, salvage_value || 0, acquisition_date, useful_life_years, notes || null, req.params.id]
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

const disposeAsset = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { disposal_date, disposal_type, disposal_value, notes } = req.body;
        const assetId = req.params.id;
        await conn.beginTransaction();

        // Ambil data aset
        const [assets] = await conn.query('SELECT * FROM FixedAsset WHERE id = ?', [assetId]);
        if (assets.length === 0) return res.status(404).json({ message: 'Aset tidak ditemukan' });
        const asset = assets[0];

        // Hitung nilai buku saat disposal
        const acquired = new Date(asset.acquisition_date);
        const disposalDateObj = new Date(disposal_date);
        const monthsElapsed = (disposalDateObj.getFullYear() - acquired.getFullYear()) * 12 + (disposalDateObj.getMonth() - acquired.getMonth());
        const totalMonths = asset.useful_life_years * 12;
        const depreciableValue = Number(asset.acquisition_value) - Number(asset.salvage_value || 0);
        const monthlyDepreciation = depreciableValue / totalMonths;
        const accumulated = Math.min(monthlyDepreciation * monthsElapsed, depreciableValue);
        const bookValue = Math.max(Number(asset.acquisition_value) - accumulated, Number(asset.salvage_value || 0));

        // Hitung untung/rugi disposal
        const saleValue = Number(disposal_value || 0);
        const gainLoss = saleValue - bookValue;

        // Update status aset
        await conn.query(
            'UPDATE FixedAsset SET status=?, disposal_date=?, disposal_type=?, disposal_value=?, notes=?, updatedAt=NOW() WHERE id=?',
            ['disposed', disposal_date, disposal_type, disposal_value || 0, notes || asset.notes, assetId]
        );

        // Catat jurnal disposal aset tetap
        const assetCoaCode = ASSET_CATEGORY_COA[asset.category] || '1400';

        const [journal] = await conn.query(
            `INSERT INTO Journal (journal_date, description, reference, type, period_month, period_year, createdAt)
     VALUES (?, ?, ?, 'asset_disposal', ?, ?, NOW())`,
            [
                disposal_date,
                `Disposal aset - ${asset.name} (${disposal_type})`,
                `AD-${Date.now()}`,
                new Date(disposal_date).getMonth() + 1,
                new Date(disposal_date).getFullYear()
            ]
        );

        const journalEntries = [
            // Hapus nilai perolehan aset
            [journal.insertId, assetCoaCode, `Hapus nilai perolehan - ${asset.name}`, 0, Number(asset.acquisition_value)],
            // Hapus akumulasi penyusutan
            [journal.insertId, '1600', `Hapus akm. penyusutan - ${asset.name}`, accumulated, 0],
        ];

        // Kalau dijual, tambah kas masuk
        if (disposal_type === 'sold' && saleValue > 0) {
            journalEntries.push([journal.insertId, '1100', `Kas dari penjualan - ${asset.name}`, saleValue, 0]);

            await conn.query(
                `INSERT INTO Cashflow (type, category, coa_code, amount, description, date, createdBy, createdAt, updatedAt)
                 VALUES ('income', 'Pelepasan Aset', '1100', ?, ?, ?, ?, NOW(), NOW())`,
                [saleValue, `Penjualan aset - ${asset.name}`, disposal_date, req.userId]
            );
        }

        // Kalau ada keuntungan/kerugian
        if (gainLoss > 0) {
            journalEntries.push([journal.insertId, '7100', `Keuntungan pelepasan aset - ${asset.name}`, 0, gainLoss]);
        } else if (gainLoss < 0) {
            journalEntries.push([journal.insertId, '7200', `Kerugian pelepasan aset - ${asset.name}`, Math.abs(gainLoss), 0]);
        }

        await conn.query(
            `INSERT INTO JournalEntry (journalId, coa_code, description, debit, credit) VALUES ?`,
            [journalEntries]
        );

        // Hapus cashflow lama yang salah (akun 1500)
        // Catat akumulasi penyusutan lewat jurnal sudah cukup, tidak perlu di cashflow
        // Kas dari penjualan sudah dicatat di jurnal entry (1100 debit)
        // Tidak perlu insert ke Cashflow lagi

        await conn.commit();
        res.json({ message: 'Aset berhasil dilepas', bookValue, gainLoss });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

module.exports = { getFixedAssets, createFixedAsset, updateFixedAsset, deleteFixedAsset, disposeAsset };