const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getCashflow, createCashflow, updateCashflow, deleteCashflow, getCashflowSummary } = require('../controllers/cashflow.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));
router.get('/', getCashflow);
router.get('/summary', getCashflowSummary);
router.post('/', createCashflow);
router.put('/:id', updateCashflow);
router.delete('/:id', deleteCashflow);

module.exports = router;