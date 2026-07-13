const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getInventory, createInventory, updateInventory, deleteInventory, getInventoryLog, createInventoryLog } = require('../controllers/inventory.controller');

router.use(verifyToken);
router.get('/', getInventory);
router.post('/', createInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);
router.get('/:id/log', getInventoryLog);
router.post('/log', createInventoryLog);

module.exports = router;