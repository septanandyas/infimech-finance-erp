const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getUnearnedRevenues, createUnearnedRevenue, deleteUnearnedRevenue } = require('../controllers/unearned.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));

router.get('/', getUnearnedRevenues);
router.post('/', createUnearnedRevenue);
router.delete('/:id', deleteUnearnedRevenue);

module.exports = router;