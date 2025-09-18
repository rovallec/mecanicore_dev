const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// POST /api/diagnostico/verificar-cliente - Verificar si cliente existe y tiene facturas pendientes
router.post('/verificar-cliente', async (req, res) => {
  try {
    const { telefono, placa } = req.body;
    
    console.log('Verificando cliente con teléfono:', telefono, 'y placa:', placa);
    
    if (!telefono && !placa) {
      return res.status(400).json({
        error: 'Datos insuficientes',
        message: 'Debe proporcionar al menos el teléfono o la placa del vehículo'
      });
    }
    
    let cliente = null;
    let vehiculo = null;
    let facturasPendientes = [];
    
    // Buscar cliente por teléfono
    if (telefono) {
      const clienteResult = await executeQuery(`
        SELECT 
          idclients as id,
          fullname as nombre,
          nit as telefono,
          address as direccion,
          contact as email
        FROM clients 
        WHERE nit = @telefono
      `, { telefono });
      
      if (clienteResult.length > 0) {
        cliente = clienteResult[0];
      }
    }
    
    // Buscar vehículo por placa
    if (placa) {
      const vehiculoResult = await executeQuery(`
        SELECT 
          v.idvehicles as id,
          v.plate as placa,
          b.name as marca,
          m.name as modelo,
          v.id_client as clienteId,
          c.fullname as clienteNombre,
          c.nit as clienteTelefono
        FROM vehicles v
        LEFT JOIN brands b ON v.id_brand = b.idbrands
        LEFT JOIN models m ON v.id_model = m.idmodels
        LEFT JOIN clients c ON v.id_client = c.idclients
        WHERE v.plate = @placa
      `, { placa: placa.toUpperCase() });
      
      if (vehiculoResult.length > 0) {
        vehiculo = vehiculoResult[0];
        // Si encontramos vehículo pero no cliente, usar el cliente del vehículo
        if (!cliente && vehiculo.clienteId) {
          cliente = {
            id: vehiculo.clienteId,
            nombre: vehiculo.clienteNombre,
            telefono: vehiculo.clienteTelefono
          };
        }
      }
    }
    
    // Si tenemos cliente, verificar facturas pendientes de diagnóstico
    if (cliente) {
      facturasPendientes = await executeQuery(`
        SELECT 
          b.idbills as id,
          b.amaunt as monto,
          b.paymentMethod as metodoPago,
          b.creationDate as fechaCreacion,
          b.status as estado
        FROM bills b
        WHERE b.id_client = @clienteId
        AND b.amaunt > 0
      `, { clienteId: cliente.id });
    }
    
    res.json({
      data: {
        clienteExiste: !!cliente,
        vehiculoExiste: !!vehiculo,
        cliente: cliente,
        vehiculo: vehiculo,
        facturasPendientes: facturasPendientes,
        requiereRegistro: !cliente || !vehiculo
      }
    });
    
  } catch (error) {
    console.error('Error verificando cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo verificar la información del cliente'
    });
  }
});

// POST /api/diagnostico/crear-factura - Crear factura de diagnóstico
router.post('/crear-factura', async (req, res) => {
  try {
   const { 
  clienteId, 
  vehiculoId, 
  montoDiagnostico, 
  metodoPago = 'EFECTIVO',
  mecanicoId,
  tipoServicioId = 1,
  descripcion = 'Diagnóstico de vehículo'
} = req.body;
    
    console.log('Creando factura de diagnóstico con orden de servicio:', { clienteId, vehiculoId, montoDiagnostico, mecanicoId, tipoServicioId 
});
console.log('Valor de mecanicoId recibido:', mecanicoId);
console.log('Tipo de mecanicoId:', typeof mecanicoId);
console.log('Condición if (mecanicoId):', !!mecanicoId);
    
    if (!clienteId || !vehiculoId || !montoDiagnostico) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Cliente, vehículo y monto son obligatorios'
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
        message: 'El vehículo no pertenece al cliente especificado'
      });
    }
    
    // Obtener el próximo ID para la factura
    const nextIdResult = await executeQuery(`
      SELECT ISNULL(MAX(idbills), 0) + 1 as nextId FROM bills
    `);
    const nextId = nextIdResult[0].nextId;
    
    // Crear la factura - SIN id_vehicle porque la tabla bills no tiene esa columna
    const facturaQuery = `
      INSERT INTO bills (idbills, id_client, amaunt, paymentMethod, creationDate, status)
      VALUES (@facturaId, @clienteId, @monto, @metodoPago, GETDATE(), 1)
    `;
    
    await executeQuery(facturaQuery, {
      facturaId: nextId,
      clienteId: parseInt(clienteId),
      monto: parseFloat(montoDiagnostico),
      metodoPago: metodoPago
    });
    
    // Obtener la factura completa creada (sin información del vehículo porque no está relacionada)
    const facturaCompleta = await executeQuery(`
      SELECT 
        b.idbills as id,
        b.amaunt as monto,
        b.paymentMethod as metodoPago,
        b.creationDate as fechaCreacion,
        c.fullname as clienteNombre,
        c.nit as clienteTelefono
      FROM bills b
      LEFT JOIN clients c ON b.id_client = c.idclients
      WHERE b.idbills = @facturaId
    `, { facturaId: nextId });

    // Obtener la información del vehículo por separado
    const vehiculoInfo = await executeQuery(`
      SELECT 
        v.plate as vehiculoPlaca,
        br.name as vehiculoMarca,
        mo.name as vehiculoModelo
      FROM vehicles v
      LEFT JOIN brands br ON v.id_brand = br.idbrands
      LEFT JOIN models mo ON v.id_model = mo.idmodels
      WHERE v.idvehicles = @vehiculoId
    `, { vehiculoId: parseInt(vehiculoId) });

    // Combinar la información
    const facturaConVehiculo = {
      ...facturaCompleta[0],
      vehiculoPlaca: vehiculoInfo[0]?.vehiculoPlaca || '',
      vehiculoMarca: vehiculoInfo[0]?.vehiculoMarca || '',
      vehiculoModelo: vehiculoInfo[0]?.vehiculoModelo || ''
    };
    
    res.status(201).json({
      message: 'Factura de diagnóstico creada exitosamente',
      data: facturaConVehiculo
    });
    
  } catch (error) {
    console.error('Error creando factura:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear la factura de diagnóstico'
    });
  }
});

module.exports = router;