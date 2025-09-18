
const { Router } = require('express');
const { getAllCases, getCaseById, getServicesByCaseId } = require('../controllers/cases.controller'); 

const router = Router();

router.get('/', getAllCases);
router.get('/:id', getCaseById);
router.get('/:caseId/services', getServicesByCaseId);


module.exports = router;