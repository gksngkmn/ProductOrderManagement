const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const {
    getManagers,
    createManager,
    updateManager,
    deleteManager,
    getCustomersByManager,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require('../controllers/superadminController');

// Sadece süper adminin bu rotalara girmesini garanti altına alıyoruz
router.use(authMiddleware, requireRole('superadmin'));

// 1. Tüm Manager'ları Getir
router.get('/managers', getManagers);
router.post('/managers', createManager);

// 2. Belirli Bir Manager'ı Sınırsız Güncelle
router.put('/managers/:id', updateManager);
router.delete('/managers/:id', deleteManager);

// 3. Manager'a Bağlı Customer'ları Getir
router.get('/managers/:id/customers', getCustomersByManager);
router.post('/managers/:id/customers', createCustomer);

// 4. Sınırsız Customer Güncelle (Doğrulama kodu sormaz)
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

module.exports = router;
