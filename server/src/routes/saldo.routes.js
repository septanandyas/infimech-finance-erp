const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getSaldo } = require('../controllers/saldo.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));
router.get('/', getSaldo);

module.exports = router;