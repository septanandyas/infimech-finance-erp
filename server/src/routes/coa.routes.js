const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getChartOfAccounts } = require('../controllers/coa.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));
router.get('/', getChartOfAccounts);

module.exports = router;
