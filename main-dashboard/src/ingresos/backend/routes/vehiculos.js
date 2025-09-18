const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /api/vehiculos - Obtener todos los vehículos
router.get('/', async (req, res) => {
  try {
    const { clienteId, search = '' } = req.query;
    
    let query = `
      SELECT 
        v.idvehicles as id,
        v.id_brand as marcaId,
        b.name as marca,
        v.id_model as modeloId,
        m.name as modelo,
        v.plate as placa,
        v.notes as notas,
        v.id_client as clienteId,
        c.fullname as clienteNombre,
        YEAR(GETDATE()) - 5 as año
      FROM vehicles v
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      LEFT JOIN clients c ON v.id_client = c.idclients
      WHERE 1=1
    `;
    
    const params = {};
    
    if (clienteId) {
      query += ` AND v.id_client = @clienteId`;
      params.clienteId = parseInt(clienteId);
    }
    
    if (search) {
      query += ` AND (b.name LIKE @search OR m.name LIKE @search OR v.plate LIKE @search)`;
      params.search = `%${search}%`;
    }
    
    query += ` ORDER BY b.name, m.name`;
    
    const result = await executeQuery(query, params);
    
    res.json({
      data: result
    });
    
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los vehículos'
    });
  }
});

// GET /api/vehiculos/cliente/:clienteId - Obtener vehículos por cliente
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const query = `
      SELECT 
        v.idvehicles as id,
        v.id_brand as marcaId,
        b.name as marca,
        v.id_model as modeloId,
        m.name as modelo,
        v.plate as placa,
        v.notes as notas,
        v.id_client as clienteId,
        YEAR(GETDATE()) - 3 as año
      FROM vehicles v
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      WHERE v.id_client = @clienteId
      ORDER BY b.name, m.name
    `;
    
    const result = await executeQuery(query, { clienteId: parseInt(clienteId) });
    
    res.json({
      data: result
    });
    
  } catch (error) {
    console.error('Error al obtener vehículos del cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los vehículos del cliente'
    });
  }
});

// GET /api/vehiculos/:id - Obtener un vehículo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        v.idvehicles as id,
        v.id_brand as marcaId,
        b.name as marca,
        v.id_model as modeloId,
        m.name as modelo,
        v.plate as placa,
        v.notes as notas,
        v.id_client as clienteId,
        c.fullname as clienteNombre,
        YEAR(GETDATE()) - 3 as año
      FROM vehicles v
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      LEFT JOIN clients c ON v.id_client = c.idclients
      WHERE v.idvehicles = @id
    `;
    
    const result = await executeQuery(query, { id: parseInt(id) });
    
    if (result.length === 0) {
      return res.status(404).json({
        error: 'Vehículo no encontrado',
        message: `No se encontró un vehículo con ID ${id}`
      });
    }
    
    res.json({
      data: result[0]
    });
    
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el vehículo'
    });
  }
});

// GET /api/vehiculos/marcas - Obtener todas las marcas
router.get('/marcas', async (req, res) => {
  try {
    const query = `
      SELECT 
        idbrands as id,
        name as nombre,
        description as descripcion
      FROM brands
      ORDER BY name
    `;
    
    const result = await executeQuery(query);
    
    res.json({
      data: result
    });
    
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las marcas'
    });
  }
});

// GET /api/vehiculos/modelos - Obtener modelos
router.get('/modelos', async (req, res) => {
  try {
    const query = `
      SELECT 
        idmodels as id,
        name as nombre,
        description as descripcion
      FROM models
      ORDER BY name
    `;
    
    const result = await executeQuery(query);
    
    res.json({
      data: result
    });
    
  } catch (error) {
    console.error('Error al obtener modelos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los modelos'
    });
  }
});

// Función helper para buscar o crear marca
const buscarOCrearMarca = async (nombreMarca) => {
  try {
    // Buscar marca existente (case insensitive)
    const marcaExistente = await executeQuery(`
      SELECT idbrands 
      FROM brands 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(@nombreMarca))
    `, { nombreMarca });

    if (marcaExistente.length > 0) {
      console.log(`Marca encontrada: ${nombreMarca} con ID ${marcaExistente[0].idbrands}`);
      return marcaExistente[0].idbrands;
    }

    // Obtener el siguiente ID disponible
    const nextIdResult = await executeQuery(`
      SELECT ISNULL(MAX(idbrands), 0) + 1 as nextId FROM brands
    `);
    const nextId = nextIdResult[0].nextId;

    // Crear nueva marca con ID específico
    await executeQuery(`
      INSERT INTO brands (idbrands, name, description) 
      VALUES (@nextId, @nombreMarca, @descripcion)
    `, { 
      nextId: nextId,
      nombreMarca: nombreMarca.trim(),
      descripcion: `Vehículos ${nombreMarca.trim()}`
    });

    console.log(`Nueva marca creada: ${nombreMarca} con ID ${nextId}`);
    return nextId;

  } catch (error) {
    console.error('Error en buscarOCrearMarca:', error);
    throw error;
  }
};

// Función helper para buscar o crear modelo (SIN relación con marca)
const buscarOCrearModelo = async (nombreModelo) => {
  try {
    // Buscar modelo existente (case insensitive)
    const modeloExistente = await executeQuery(`
      SELECT idmodels 
      FROM models 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(@nombreModelo))
    `, { nombreModelo });

    if (modeloExistente.length > 0) {
      console.log(`Modelo encontrado: ${nombreModelo} con ID ${modeloExistente[0].idmodels}`);
      return modeloExistente[0].idmodels;
    }

    // Obtener el siguiente ID disponible
    const nextIdResult = await executeQuery(`
      SELECT ISNULL(MAX(idmodels), 0) + 1 as nextId FROM models
    `);
    const nextId = nextIdResult[0].nextId;

    // Crear nuevo modelo con ID específico (SIN id_brand)
    await executeQuery(`
      INSERT INTO models (idmodels, name, description) 
      VALUES (@nextId, @nombreModelo, @descripcion)
    `, { 
      nextId: nextId,
      nombreModelo: nombreModelo.trim(),
      descripcion: `Modelo ${nombreModelo.trim()}`
    });

    console.log(`Nuevo modelo creado: ${nombreModelo} con ID ${nextId}`);
    return nextId;

  } catch (error) {
    console.error('Error en buscarOCrearModelo:', error);
    throw error;
  }
};

// POST /api/vehiculos - Crear nuevo vehículo
router.post('/', async (req, res) => {
  try {
    const { marca, modelo, placa, clienteId, notas } = req.body;
    
    console.log('Datos recibidos para crear vehículo:', { marca, modelo, placa, clienteId, notas });
    
    if (!marca || !modelo || !placa || !clienteId) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Marca, modelo, placa y cliente son campos obligatorios'
      });
    }

    // Verificar que el cliente existe
    const clienteExiste = await executeQuery(`
      SELECT idclients FROM clients WHERE idclients = @clienteId
    `, { clienteId: parseInt(clienteId) });

    if (clienteExiste.length === 0) {
      return res.status(400).json({
        error: 'Cliente no encontrado',
        message: 'El cliente especificado no existe'
      });
    }

    // Verificar que la placa no esté duplicada
    const placaExiste = await executeQuery(`
      SELECT idvehicles FROM vehicles WHERE UPPER(TRIM(plate)) = UPPER(TRIM(@placa))
    `, { placa });

    if (placaExiste.length > 0) {
      return res.status(409).json({
        error: 'Placa duplicada',
        message: 'Ya existe un vehículo con esa placa'
      });
    }
    
    // Buscar o crear marca
    const marcaId = await buscarOCrearMarca(marca);
    
    // Buscar o crear modelo (independiente de la marca)
    const modeloId = await buscarOCrearModelo(modelo);
    
    // Obtener el siguiente ID para el vehículo
    const nextVehicleIdResult = await executeQuery(`
      SELECT ISNULL(MAX(idvehicles), 0) + 1 as nextId FROM vehicles
    `);
    const nextVehicleId = nextVehicleIdResult[0].nextId;
    
    // Crear vehículo
    await executeQuery(`
      INSERT INTO vehicles (idvehicles, id_brand, id_model, plate, id_client, notes)
      VALUES (@vehicleId, @marcaId, @modeloId, @placa, @clienteId, @notas)
    `, {
      vehicleId: nextVehicleId,
      marcaId: marcaId,
      modeloId: modeloId,
      placa: placa.toUpperCase().trim(),
      clienteId: parseInt(clienteId),
      notas: notas || null
    });
    
    // Obtener el vehículo completo creado
    const vehiculoCompleto = await executeQuery(`
      SELECT 
        v.idvehicles as id,
        b.name as marca,
        m.name as modelo,
        v.plate as placa,
        v.notes as notas,
        v.id_client as clienteId,
        c.fullname as clienteNombre
      FROM vehicles v
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      LEFT JOIN clients c ON v.id_client = c.idclients
      WHERE v.idvehicles = @id
    `, { id: nextVehicleId });
    
    console.log('Vehículo creado exitosamente:', vehiculoCompleto[0]);
    
    res.status(201).json({
      message: 'Vehículo creado exitosamente',
      data: {
        ...vehiculoCompleto[0],
        año: new Date().getFullYear()
      }
    });
    
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    
    if (error.number === 2627) {
      return res.status(409).json({
        error: 'Vehículo ya existe',
        message: 'Ya existe un vehículo con esa placa'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el vehículo'
    });
  }
});

// PUT /api/vehiculos/:id - Actualizar vehículo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { notas, placa } = req.body;
    
    const existingVehicle = await executeQuery(
      'SELECT idvehicles FROM vehicles WHERE idvehicles = @id',
      { id: parseInt(id) }
    );
    
    if (existingVehicle.length === 0) {
      return res.status(404).json({
        error: 'Vehículo no encontrado',
        message: `No se encontró un vehículo con ID ${id}`
      });
    }
    
    let updateFields = [];
    const params = { id: parseInt(id) };
    
    if (placa !== undefined) {
      updateFields.push('plate = @placa');
      params.placa = placa.toUpperCase();
    }
    
    if (notas !== undefined) {
      updateFields.push('notes = @notas');
      params.notas = notas;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No hay datos para actualizar',
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }
    
    const query = `
      UPDATE vehicles 
      SET ${updateFields.join(', ')}
      WHERE idvehicles = @id
    `;
    
    await executeQuery(query, params);
    
    // Obtener el vehículo actualizado
    const vehiculoActualizado = await executeQuery(`
      SELECT 
        v.idvehicles as id,
        b.name as marca,
        m.name as modelo,
        v.plate as placa,
        v.notes as notas,
        v.id_client as clienteId
      FROM vehicles v
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      WHERE v.idvehicles = @id
    `, { id: parseInt(id) });
    
    res.json({
      message: 'Vehículo actualizado exitosamente',
      data: vehiculoActualizado[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el vehículo'
    });
  }
});

module.exports = router;