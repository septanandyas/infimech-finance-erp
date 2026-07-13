const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getLedgerEntries } = require('../controllers/ledger.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));
router.get('/', getLedgerEntries);

module.exports = router;
