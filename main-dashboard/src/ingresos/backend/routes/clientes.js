const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /api/clientes - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const { search = '', limit = 100 } = req.query;
    
    let query = `
      SELECT 
        idclients as id,
        fullname as nombre,
        nit as telefono,
        address as direccion,
        contact as email
      FROM clients
      WHERE 1=1
    `;
    
    const params = {};
    
    if (search) {
      query += ` AND (fullname LIKE @search OR nit LIKE @search OR contact LIKE @search)`;
      params.search = `%${search}%`;
    }
    
    query += ` ORDER BY fullname`;
    
    if (limit) {
      query += ` OFFSET 0 ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;
    }
    
    const result = await executeQuery(query, params);
    
    res.json({
      data: result,
      total: result.length,
      pagination: {
        page: 1,
        limit: parseInt(limit),
        totalPages: 1
      }
    });
    
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los clientes'
    });
  }
});

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        idclients as id,
        fullname as nombre,
        nit as telefono,
        address as direccion,
        contact as email
      FROM clients
      WHERE idclients = @id
    `;
    
    const result = await executeQuery(query, { id: parseInt(id) });
    
    if (result.length === 0) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con ID ${id}`
      });
    }
    
    res.json({
      data: result[0]
    });
    
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el cliente'
    });
  }
});

// POST /api/clientes - Crear nuevo cliente
router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, email, direccion } = req.body;
    
    if (!nombre || !telefono) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Nombre y teléfono son campos obligatorios'
      });
    }
    
    const query = `
      INSERT INTO clients (fullname, nit, address, contact)
      OUTPUT INSERTED.idclients as id, INSERTED.fullname as nombre, 
             INSERTED.nit as telefono, INSERTED.address as direccion, 
             INSERTED.contact as email
      VALUES (@nombre, @telefono, @direccion, @email)
    `;
    
    const result = await executeQuery(query, {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion?.trim() || null,
      email: email?.trim() || null
    });
    
    res.status(201).json({
      message: 'Cliente creado exitosamente',
      data: result[0]
    });
    
  } catch (error) {
    console.error('Error al crear cliente:', error);
    
    if (error.message.includes('duplicate') || error.number === 2627) {
      return res.status(409).json({
        error: 'Cliente ya existe',
        message: 'Ya existe un cliente con estos datos'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el cliente'
    });
  }
});

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, direccion } = req.body;
    
    const checkQuery = 'SELECT idclients FROM clients WHERE idclients = @id';
    const existing = await executeQuery(checkQuery, { id: parseInt(id) });
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con ID ${id}`
      });
    }
    
    const query = `
      UPDATE clients 
      SET fullname = @nombre,
          nit = @telefono,
          address = @direccion,
          contact = @email
      WHERE idclients = @id;
      
      SELECT 
        idclients as id,
        fullname as nombre,
        nit as telefono,
        address as direccion,
        contact as email
      FROM clients
      WHERE idclients = @id
    `;
    
    const result = await executeQuery(query, {
      id: parseInt(id),
      nombre: nombre?.trim(),
      telefono: telefono?.trim(),
      direccion: direccion?.trim() || null,
      email: email?.trim() || null
    });
    
    res.json({
      message: 'Cliente actualizado exitosamente',
      data: result[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el cliente'
    });
  }
});

// GET /api/clientes/search - Buscar clientes
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Búsqueda inválida',
        message: 'El término de búsqueda debe tener al menos 2 caracteres'
      });
    }
    
    const query = `
      SELECT TOP 10
        idclients as id,
        fullname as nombre,
        nit as telefono,
        contact as email
      FROM clients
      WHERE fullname LIKE @searchTerm 
         OR nit LIKE @searchTerm
         OR contact LIKE @searchTerm
      ORDER BY fullname
    `;
    
    const result = await executeQuery(query, { searchTerm: `%${q}%` });
    
    res.json({
      data: result
    });
    
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo realizar la búsqueda'
    });
  }
});

module.exports = router;