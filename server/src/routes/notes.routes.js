const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/notes.controller');

// Semua user yang sudah login bisa mengakses catatan
router.use(verifyToken);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
