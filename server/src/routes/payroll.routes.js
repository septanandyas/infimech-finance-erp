const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
    getPayrolls,
    getPayrollById,
    getEmployees,
    createPayroll,
    updatePayroll,
    deletePayroll
} = require('../controllers/payroll.controller');

router.use(verifyToken);
router.use(checkRole(['Superadmin', 'Manajemen']));

router.get('/employees', getEmployees);
router.get('/', getPayrolls);
router.get('/:id', getPayrollById);
router.post('/', createPayroll);
router.put('/:id', updatePayroll);
router.delete('/:id', deletePayroll);

module.exports = router;
