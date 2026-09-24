const db = require('../utils/db');

// GET semua catatan (dengan filter kategori & search)
const getNotes = async (req, res) => {
    try {
        const { kategori, search } = req.query;
        let sql = `
            SELECT n.*, u.username as penulisName
            FROM Notes n
            JOIN User u ON n.createdBy = u.id
            WHERE 1=1
        `;
        const params = [];

        if (kategori && kategori !== 'Semua') {
            sql += ' AND n.kategori = ?';
            params.push(kategori);
        }

        if (search) {
            sql += ' AND (n.judul LIKE ? OR n.isi LIKE ? OR u.username LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        sql += ' ORDER BY n.createdAt DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET satu catatan
const getNoteById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT n.*, u.username as penulisName
             FROM Notes n
             JOIN User u ON n.createdBy = u.id
             WHERE n.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Catatan tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST buat catatan baru
const createNote = async (req, res) => {
    try {
        const { judul, isi, kategori } = req.body;
        if (!judul || !isi || !kategori) {
            return res.status(400).json({ message: 'Judul, isi, dan kategori wajib diisi' });
        }
        const [result] = await db.query(
            'INSERT INTO Notes (judul, isi, kategori, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [judul, isi, kategori, req.userId]
        );
        const [newRow] = await db.query(
            `SELECT n.*, u.username as penulisName FROM Notes n JOIN User u ON n.createdBy = u.id WHERE n.id = ?`,
            [result.insertId]
        );
        res.json(newRow[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT update catatan
const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { judul, isi, kategori } = req.body;

        // Hanya pemilik atau super_admin yang bisa edit
        const [existing] = await db.query('SELECT * FROM Notes WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Catatan tidak ditemukan' });
        if (existing[0].createdBy !== req.userId && req.roleName !== 'Superadmin') {
            return res.status(403).json({ message: 'Tidak diizinkan mengedit catatan ini' });
        }

        await db.query(
            'UPDATE Notes SET judul=?, isi=?, kategori=?, updatedAt=NOW() WHERE id=?',
            [judul, isi, kategori, id]
        );
        res.json({ message: 'Catatan berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE catatan
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;

        // Hanya pemilik atau super_admin yang bisa hapus
        const [existing] = await db.query('SELECT * FROM Notes WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Catatan tidak ditemukan' });
        if (existing[0].createdBy !== req.userId && req.roleName !== 'Superadmin') {
            return res.status(403).json({ message: 'Tidak diizinkan menghapus catatan ini' });
        }

        await db.query('DELETE FROM Notes WHERE id = ?', [id]);
        res.json({ message: 'Catatan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote };
