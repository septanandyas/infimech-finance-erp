const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { getFixedAssets, createFixedAsset, updateFixedAsset, deleteFixedAsset } = require('../controllers/fixedasset.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));

router.get('/', getFixedAssets);
router.post('/', createFixedAsset);
router.put('/:id', updateFixedAsset);
router.delete('/:id', deleteFixedAsset);

module.exports = router;