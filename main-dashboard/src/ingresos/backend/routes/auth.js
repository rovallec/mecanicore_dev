const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /api/auth/current-user - Obtener usuario actual
router.get('/current-user', async (req, res) => {
  try {
    // Buscar primero un usuario de tipo MECHANIC
    const mechanicQuery = `
      SELECT TOP 1
        iduser as id,
        username as usuario,
        displayname as nombre,
        type as tipo
      FROM users
      WHERE type = 'MECHANIC'
      ORDER BY iduser
    `;
    
    const mechanicResult = await executeQuery(mechanicQuery);
    
    if (mechanicResult.length > 0) {
      return res.json({
        data: mechanicResult[0]
      });
    }
    
    // Si no hay mecánicos, buscar admin
    const adminQuery = `
      SELECT TOP 1
        iduser as id,
        username as usuario,
        displayname as nombre,
        type as tipo
      FROM users
      WHERE type = 'ADMIN'
      ORDER BY iduser
    `;
    
    const adminResult = await executeQuery(adminQuery);
    
    if (adminResult.length > 0) {
      return res.json({
        data: adminResult[0]
      });
    }
    
    // Si no hay admin ni mecánico, tomar cualquier usuario
    const fallbackQuery = `
      SELECT TOP 1
        iduser as id,
        username as usuario,
        displayname as nombre,
        type as tipo
      FROM users
      ORDER BY iduser
    `;
    
    const fallbackResult = await executeQuery(fallbackQuery);
    
    if (fallbackResult.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró ningún usuario en el sistema'
      });
    }
    
    res.json({
      data: fallbackResult[0]
    });
    
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el usuario actual'
    });
  }
});

// GET /api/auth/users - Obtener todos los usuarios (opcional)
router.get('/users', async (req, res) => {
  try {
    const query = `
      SELECT 
        iduser as id,
        username as usuario,
        displayname as nombre,
        type as tipo
      FROM users
      ORDER BY 
        CASE 
          WHEN type = 'MECHANIC' THEN 1
          WHEN type = 'ADMIN' THEN 2
          ELSE 3
        END,
        username
    `;
    
    const result = await executeQuery(query);
    
    res.json({
      data: result
    });
    
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los usuarios'
    });
  }
});

// GET /api/auth/mechanics - Obtener solo mecánicos
router.get('/mechanics', async (req, res) => {
  try {
    const query = `
      SELECT 
        iduser as id,
        username as usuario,
        displayname as nombre,
        type as tipo
      FROM users
      WHERE type = 'MECHANIC'
      ORDER BY username
    `;
    
    const result = await executeQuery(query);
    
    res.json({
      data: result
    });
    
  } catch (error) {
    console.error('Error al obtener mecánicos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los mecánicos'
    });
  }
});

module.exports = router;