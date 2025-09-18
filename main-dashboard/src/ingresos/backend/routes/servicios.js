const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /api/servicios - Obtener todos los servicios
router.get('/', async (req, res) => {
  try {
    const { search = '', activo = true } = req.query;
    
    let query = `
      SELECT 
        idserviceTypes as id,
        id_inventory as inventoryId,
        name as nombre,
        description as descripcion,
        notes as notas,
        price as precio
      FROM serviceTypes
      WHERE 1=1
    `;
    
    const params = {};
    
    // Filtrar por búsqueda si existe
    if (search) {
      query += ` AND (name LIKE '%' + @search + '%' OR description LIKE '%' + @search + '%')`;
      params.search = search;
    }
    
    query += ` ORDER BY name`;
    
    const result = await executeQuery(query, params);
    
    // Transformar datos y agregar información adicional
    const servicios = result.map(servicio => ({
      ...servicio,
      precio: parseFloat(servicio.precio) || 0,
      categoria: 'GENERAL' // Por defecto, se puede mejorar después
    }));
    
    res.json({
      data: servicios
    });
    
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los servicios'
    });
  }
});

// GET /api/servicios/:id - Obtener un servicio por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        idserviceTypes as id,
        id_inventory as inventoryId,
        name as nombre,
        description as descripcion,
        notes as notas,
        price as precio
      FROM serviceTypes
      WHERE idserviceTypes = @id
    `;
    
    const result = await executeQuery(query, { id: parseInt(id) });
    
    if (result.length === 0) {
      return res.status(404).json({
        error: 'Servicio no encontrado',
        message: `No se encontró un servicio con ID ${id}`
      });
    }
    
    const servicio = {
      ...result[0],
      precio: parseFloat(result[0].precio) || 0,
      categoria: 'GENERAL'
    };
    
    res.json({
      data: servicio
    });
    
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el servicio'
    });
  }
});

// POST /api/servicios - Crear nuevo servicio
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, precio, notas } = req.body;
    
    // Validaciones básicas
    if (!nombre || precio === undefined) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Nombre y precio son campos obligatorios'
      });
    }
    
    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({
        error: 'Precio inválido',
        message: 'El precio debe ser un número mayor o igual a 0'
      });
    }
    
    const query = `
      INSERT INTO serviceTypes (name, description, price, notes)
      OUTPUT INSERTED.idserviceTypes as id, INSERTED.name as nombre, 
             INSERTED.description as descripcion, INSERTED.price as precio,
             INSERTED.notes as notas
      VALUES (@nombre, @descripcion, @precio, @notas)
    `;
    
    const result = await executeQuery(query, {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      precio: parseFloat(precio),
      notas: notas?.trim() || null
    });
    
    res.status(201).json({
      message: 'Servicio creado exitosamente',
      data: {
        ...result[0],
        precio: parseFloat(result[0].precio),
        categoria: 'GENERAL'
      }
    });
    
  } catch (error) {
    console.error('Error al crear servicio:', error);
    
    if (error.number === 2627) {
      return res.status(409).json({
        error: 'Servicio ya existe',
        message: 'Ya existe un servicio con ese nombre'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el servicio'
    });
  }
});

// PUT /api/servicios/:id - Actualizar servicio
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, notas } = req.body;
    
    // Verificar que el servicio existe
    const existingService = await executeQuery(
      'SELECT idserviceTypes FROM serviceTypes WHERE idserviceTypes = @id',
      { id: parseInt(id) }
    );
    
    if (existingService.length === 0) {
      return res.status(404).json({
        error: 'Servicio no encontrado',
        message: `No se encontró un servicio con ID ${id}`
      });
    }
    
    // Validar precio si se proporciona
    if (precio !== undefined && (isNaN(precio) || precio < 0)) {
      return res.status(400).json({
        error: 'Precio inválido',
        message: 'El precio debe ser un número mayor o igual a 0'
      });
    }
    
    const query = `
      UPDATE serviceTypes 
      SET name = @nombre,
          description = @descripcion,
          price = @precio,
          notes = @notas
      WHERE idserviceTypes = @id;
      
      SELECT 
        idserviceTypes as id,
        name as nombre,
        description as descripcion,
        price as precio,
        notes as notas
      FROM serviceTypes
      WHERE idserviceTypes = @id
    `;
    
    const result = await executeQuery(query, {
      id: parseInt(id),
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim() || '',
      precio: precio !== undefined ? parseFloat(precio) : undefined,
      notas: notas?.trim() || null
    });
    
    res.json({
      message: 'Servicio actualizado exitosamente',
      data: {
        ...result[0],
        precio: parseFloat(result[0].precio),
        categoria: 'GENERAL'
      }
    });
    
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el servicio'
    });
  }
});

// DELETE /api/servicios/:id - Eliminar servicio
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el servicio existe
    const existingService = await executeQuery(
      'SELECT idserviceTypes FROM serviceTypes WHERE idserviceTypes = @id',
      { id: parseInt(id) }
    );
    
    if (existingService.length === 0) {
      return res.status(404).json({
        error: 'Servicio no encontrado',
        message: `No se encontró un servicio con ID ${id}`
      });
    }
    
    await executeQuery('DELETE FROM serviceTypes WHERE idserviceTypes = @id', { id: parseInt(id) });
    
    res.json({
      message: 'Servicio eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    
    // Error de clave foránea (tiene dependencias)
    if (error.number === 547) {
      return res.status(409).json({
        error: 'Servicio tiene dependencias',
        message: 'No se puede eliminar el servicio porque está siendo utilizado en casos activos'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el servicio'
    });
  }
});

// GET /api/servicios/search - Buscar servicios
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
        idserviceTypes as id,
        name as nombre,
        description as descripcion,
        price as precio
      FROM serviceTypes
      WHERE name LIKE '%' + @searchTerm + '%' 
         OR description LIKE '%' + @searchTerm + '%'
      ORDER BY name
    `;
    
    const result = await executeQuery(query, { searchTerm: q });
    
    const servicios = result.map(servicio => ({
      ...servicio,
      precio: parseFloat(servicio.precio) || 0,
      categoria: 'GENERAL'
    }));
    
    res.json({
      data: servicios
    });
    
  } catch (error) {
    console.error('Error al buscar servicios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo realizar la búsqueda'
    });
  }
});

// GET /api/servicios/populares - Obtener servicios más utilizados
router.get('/populares', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Esta consulta sería más compleja con datos reales de uso
    // Por ahora retornamos todos los servicios ordenados por nombre
    const query = `
      SELECT TOP ${parseInt(limit)}
        idserviceTypes as id,
        name as nombre,
        description as descripcion,
        price as precio
      FROM serviceTypes
      ORDER BY name
    `;
    
    const result = await executeQuery(query);
    
    const servicios = result.map(servicio => ({
      ...servicio,
      precio: parseFloat(servicio.precio) || 0,
      categoria: 'GENERAL',
      popularidad: Math.floor(Math.random() * 100) + 1 // Simulado
    }));
    
    res.json({
      data: servicios
    });
    
  } catch (error) {
    console.error('Error al obtener servicios populares:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los servicios populares'
    });
  }
});

module.exports = router;