const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getNeraca } = require('../controllers/neraca.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));
router.get('/', getNeraca);

module.exports = router;