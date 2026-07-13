const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getLiabilities, createLiability, updateLiability, deleteLiability } = require('../controllers/liability.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));

router.get('/', getLiabilities);
router.post('/', createLiability);
router.put('/:id', updateLiability);
router.delete('/:id', deleteLiability);

module.exports = router;
