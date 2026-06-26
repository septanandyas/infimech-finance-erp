const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getInvoices, createInvoice, getInvoiceById, updateInvoice, updateInvoiceStatus, deleteInvoice, getProspects } = require('../controllers/invoice.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));
router.get('/', getInvoices);
router.get('/prospects', getProspects);
router.post('/', createInvoice);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

module.exports = router;