const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /api/mecanicos - Obtener todos los mecánicos disponibles
router.get('/', async (req, res) => {
  try {
    const mecanicos = await executeQuery(`
      SELECT 
        iduser as id,
        displayname as nombre,
        username as usuario,
        type as tipo
      FROM users 
      WHERE type = 'MECHANIC'
      ORDER BY displayname
    `);

    res.json({
      message: 'Mecánicos obtenidos exitosamente',
      data: mecanicos
    });
  } catch (error) {
    console.error('Error obteniendo mecánicos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los mecánicos'
    });
  }
});

module.exports = router;