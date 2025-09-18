const express = require('express');
const router = express.Router();
const {
  getAllServiceTypes,
  getServiceTypeById,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  searchServiceTypes
} = require('../controllers/serviceTypeController');

// Rutas
router.get('/', getAllServiceTypes);
router.get('/search', searchServiceTypes);
router.get('/:id', getServiceTypeById);
router.post('/', createServiceType);
router.put('/:id', updateServiceType);
router.delete('/:id', deleteServiceType);

module.exports = router;