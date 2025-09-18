const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /api/ingresos - Obtener todos los ingresos/casos
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      clienteId, 
      search = '' 
    } = req.query;
    
    let query = `
      SELECT 
        c.idcases as id,
        c.id_vehicle as vehiculoId,
        c.id_agent as agenteId,
        c.id_bill as facturaId,
        c.description as descripcion,
        v.plate as vehiculoPlaca,
        b.name as vehiculoMarca,
        m.name as vehiculoModelo,
        cl.fullname as clienteNombre,
        cl.nit as clienteTelefono,
        u.username as agenteNombre
      FROM cases c
      LEFT JOIN vehicles v ON c.id_vehicle = v.idvehicles
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      LEFT JOIN clients cl ON v.id_client = cl.idclients
      LEFT JOIN users u ON c.id_agent = u.iduser
      WHERE 1=1
    `;
    
    const params = {};
    
    // Filtros
    if (clienteId) {
      query += ` AND v.id_client = @clienteId`;
      params.clienteId = parseInt(clienteId);
    }
    
    if (search) {
      query += ` AND (cl.fullname LIKE '%' + @search + '%' OR v.plate LIKE '%' + @search + '%' OR c.description LIKE '%' + @search + '%')`;
      params.search = search;
    }
    
    query += ` ORDER BY c.idcases DESC`;
    
    const result = await executeQuery(query, params);
    
    // Calcular paginación
    const total = result.length;
    const totalPages = Math.ceil(total / parseInt(limit));
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedResult = result.slice(offset, offset + parseInt(limit));
    
    res.json({
      data: paginatedResult,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los ingresos'
    });
  }
});

// GET /api/ingresos/:id - Obtener un ingreso por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        c.idcases as id,
        c.id_vehicle as vehiculoId,
        c.id_agent as agenteId,
        c.id_bill as facturaId,
        c.description as descripcion,
        v.plate as vehiculoPlaca,
        b.name as vehiculoMarca,
        m.name as vehiculoModelo,
        cl.idclients as clienteId,
        cl.fullname as clienteNombre,
        cl.nit as clienteTelefono,
        u.username as agenteNombre
      FROM cases c
      LEFT JOIN vehicles v ON c.id_vehicle = v.idvehicles
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      LEFT JOIN clients cl ON v.id_client = cl.idclients
      LEFT JOIN users u ON c.id_agent = u.iduser
      WHERE c.idcases = @id
    `;
    
    const result = await executeQuery(query, { id: parseInt(id) });
    
    if (result.length === 0) {
      return res.status(404).json({
        error: 'Ingreso no encontrado',
        message: `No se encontró un ingreso con ID ${id}`
      });
    }
    
    // Obtener servicios asociados al caso
    const serviciosQuery = `
      SELECT 
        s.idservices as id,
        st.name as nombre,
        st.description as descripcion,
        s.driven as tecnico
      FROM services s
      LEFT JOIN serviceTypes st ON s.id_serviceType = st.idserviceTypes
      WHERE s.id_case = @caseId
    `;
    
    const servicios = await executeQuery(serviciosQuery, { caseId: parseInt(id) });
    
    res.json({
      data: {
        ...result[0],
        servicios
      }
    });
    
  } catch (error) {
    console.error('Error al obtener ingreso:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el ingreso'
    });
  }
});

// POST /api/ingresos - Crear nuevo ingreso
router.post('/', async (req, res) => {
  try {
    const { 
      clienteId, 
      vehiculoId, 
      fecha, 
      agente, 
      descripcion, 
      servicios = [],
      total = 0,
      usuarioId
    } = req.body;
    
    // Logs para debug
    console.log('=== DATOS RECIBIDOS ===');
    console.log('req.body completo:', req.body);
    console.log('clienteId:', clienteId);
    console.log('vehiculoId:', vehiculoId);
    console.log('servicios:', servicios);
    console.log('usuarioId:', usuarioId);
    console.log('agente:', agente);
    console.log('========================');
    
    // Validaciones básicas
    if (!clienteId || !vehiculoId || !servicios.length) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Cliente, vehículo y al menos un servicio son obligatorios'
      });
    }
    
    // Verificar que el vehículo pertenece al cliente
    const vehiculoCliente = await executeQuery(`
      SELECT v.idvehicles 
      FROM vehicles v 
      WHERE v.idvehicles = @vehiculoId AND v.id_client = @clienteId
    `, { vehiculoId: parseInt(vehiculoId), clienteId: parseInt(clienteId) });
    
    if (vehiculoCliente.length === 0) {
      return res.status(400).json({
        error: 'Vehículo inválido',
        message: 'El vehículo seleccionado no pertenece al cliente'
      });
    }
    
    // Buscar ID del agente - primero por usuarioId, luego por nombre
    let agenteId = usuarioId || 1;
    
    // Si no se envió usuarioId, buscar por nombre del agente
    if (!usuarioId && agente) {
      const agenteResult = await executeQuery(
        'SELECT iduser FROM users WHERE displayname = @agente OR username = @agente',
        { agente }
      );
      if (agenteResult.length > 0) {
        agenteId = agenteResult[0].iduser;
      }
    }
    
    console.log('ID del agente a usar:', agenteId);
    
    // Validar que los servicios existen
    for (const servicioId of servicios) {
      const servicioExists = await executeQuery(
        'SELECT idserviceTypes FROM serviceTypes WHERE idserviceTypes = @servicioId',
        { servicioId: parseInt(servicioId) }
      );
      
      if (servicioExists.length === 0) {
        console.error(`Servicio con ID ${servicioId} no existe`);
        return res.status(400).json({
          error: 'Servicio inválido',
          message: `El servicio con ID ${servicioId} no existe`
        });
      }
    }
    
    // Crear el caso SIN fechas y SIN estado
    const casoQuery = `
      INSERT INTO cases (id_vehicle, id_agent, description)
      OUTPUT INSERTED.idcases as id
      VALUES (@vehiculoId, @agenteId, @descripcion)
    `;
    
    const casoResult = await executeQuery(casoQuery, {
      vehiculoId: parseInt(vehiculoId),
      agenteId: parseInt(agenteId),
      descripcion: descripcion || 'Ingreso de vehículo al taller'
    });
    
    const casoId = casoResult[0].id;
    console.log('Caso creado con ID:', casoId);
    
    // Crear los servicios asociados SIN fechas y SIN estado
    for (const servicioId of servicios) {
      await executeQuery(`
        INSERT INTO services (id_case, id_serviceType, driven)
        VALUES (@casoId, @servicioId, @tecnico)
      `, {
        casoId: parseInt(casoId),
        servicioId: parseInt(servicioId),
        tecnico: agente || 'Mecánico'
      });
    }
    
    console.log('Servicios creados para el caso');
    
    // Obtener el caso completo creado
    const casoCompleto = await executeQuery(`
      SELECT 
        c.idcases as id,
        c.id_vehicle as vehiculoId,
        c.description as descripcion,
        v.plate as vehiculoPlaca,
        b.name as vehiculoMarca,
        m.name as vehiculoModelo,
        cl.fullname as clienteNombre,
        u.username as agenteNombre
      FROM cases c
      LEFT JOIN vehicles v ON c.id_vehicle = v.idvehicles
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      LEFT JOIN clients cl ON v.id_client = cl.idclients
      LEFT JOIN users u ON c.id_agent = u.iduser
      WHERE c.idcases = @casoId
    `, { casoId: parseInt(casoId) });
    
    res.status(201).json({
      message: 'Ingreso registrado exitosamente',
      data: {
        ...casoCompleto[0],
        total: parseFloat(total)
      }
    });
    
  } catch (error) {
    console.error('Error al crear ingreso:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el ingreso',
      details: error.message
    });
  }
});

// PUT /api/ingresos/:id - Actualizar ingreso
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;
    
    // Verificar que el caso existe
    const existingCase = await executeQuery(
      'SELECT idcases FROM cases WHERE idcases = @id',
      { id: parseInt(id) }
    );
    
    if (existingCase.length === 0) {
      return res.status(404).json({
        error: 'Ingreso no encontrado',
        message: `No se encontró un ingreso con ID ${id}`
      });
    }
    
    if (!descripcion) {
      return res.status(400).json({
        error: 'No hay datos para actualizar',
        message: 'Debe proporcionar una descripción para actualizar'
      });
    }
    
    const query = `
      UPDATE cases 
      SET description = @descripcion
      WHERE idcases = @id
    `;
    
    await executeQuery(query, {
      id: parseInt(id),
      descripcion: descripcion
    });
    
    // Obtener el caso actualizado
    const casoActualizado = await executeQuery(`
      SELECT 
        c.idcases as id,
        c.description as descripcion,
        v.plate as vehiculoPlaca,
        cl.fullname as clienteNombre
      FROM cases c
      LEFT JOIN vehicles v ON c.id_vehicle = v.idvehicles
      LEFT JOIN clients cl ON v.id_client = cl.idclients
      WHERE c.idcases = @id
    `, { id: parseInt(id) });
    
    res.json({
      message: 'Ingreso actualizado exitosamente',
      data: casoActualizado[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar ingreso:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el ingreso'
    });
  }
});

// GET /api/ingresos/estadisticas - Obtener estadísticas básicas
router.get('/estadisticas', async (req, res) => {
  try {
    const estadisticasQuery = `
      SELECT 
        COUNT(*) as totalCasos
      FROM cases
    `;
    
    const estadisticas = await executeQuery(estadisticasQuery);
    
    res.json({
      data: estadisticas[0] || {
        totalCasos: 0
      }
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas'
    });
  }
});

module.exports = router;