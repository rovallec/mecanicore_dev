const { executeQuery } = require('./config/database');

// Script para verificar que la tabla cases se llene correctamente
const verificarTablaCase = async () => {
  try {
    console.log('🔍 VERIFICANDO TABLA CASES Y SERVICIOS');
    console.log('=' .repeat(70));

    // 1. Verificar estructura de la tabla cases
    console.log('\n📋 ESTRUCTURA DE LA TABLA CASES:');
    console.log('-'.repeat(50));
    
    const estructuraCases = await executeQuery(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'cases'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Columnas en tabla CASES:');
    estructuraCases.forEach((col, i) => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT: ${col.COLUMN_DEFAULT}` : '';
      console.log(`  ${i + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${nullable}${defaultVal}`);
    });

    // 2. Mostrar todos los casos registrados con detalles completos
    console.log('\n📝 CASOS REGISTRADOS EN LA TABLA:');
    console.log('-'.repeat(50));
    
    const casosCompletos = await executeQuery(`
      SELECT 
        c.idcases as caseId,
        c.id_vehicle as vehiculoId,
        c.id_agent as agenteId,
        c.id_bill as facturaId,
        c.description as descripcion,
        -- Datos del vehículo
        v.plate as vehiculoPlaca,
        b.name as vehiculoMarca,
        m.name as vehiculoModelo,
        -- Datos del cliente/agente
        cl.fullname as clienteNombre,
        cl.nit as clienteTelefono,
        -- Datos de la factura
        f.amaunt as facturaMontoTotal,
        f.paymentMethod as facturaMetodoPago,
        f.creationDate as facturaFechaCreacion
      FROM cases c
      LEFT JOIN vehicles v ON c.id_vehicle = v.idvehicles
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      LEFT JOIN clients cl ON c.id_agent = cl.idclients
      LEFT JOIN bills f ON c.id_bill = f.idbills
      ORDER BY c.idcases DESC
    `);

    if (casosCompletos.length === 0) {
      console.log('❌ No hay casos registrados en la tabla');
    } else {
      console.log(`✅ Total de casos encontrados: ${casosCompletos.length}\n`);
      
      casosCompletos.forEach((caso, index) => {
        console.log(`CASO ${index + 1}:`);
        console.log(`  ID del Caso: ${caso.caseId}`);
        console.log(`  Descripción: ${caso.descripcion || 'Sin descripción'}`);
        console.log(`  
  RELACIONES:`);
        console.log(`    Vehículo ID: ${caso.vehiculoId} | Placa: ${caso.vehiculoPlaca} | ${caso.vehiculoMarca} ${caso.vehiculoModelo}`);
        console.log(`    Cliente/Agente ID: ${caso.agenteId} | Nombre: ${caso.clienteNombre} | Tel: ${caso.clienteTelefono}`);
        console.log(`    Factura ID: ${caso.facturaId} | Monto: Q${caso.facturaMontoTotal} | Método: ${caso.facturaMetodoPago}`);
        console.log(`    Fecha de Factura: ${caso.facturaFechaCreacion}`);
        console.log('-'.repeat(50));
      });
    }

    // 3. Verificar servicios asociados a los casos
    console.log('\n🔧 SERVICIOS ASOCIADOS A LOS CASOS:');
    console.log('-'.repeat(50));
    
    const serviciosCompletos = await executeQuery(`
      SELECT 
        s.idservices as servicioId,
        s.id_case as caseId,
        s.id_serviceType as tipoServicioId,
        s.id_mechanic as mecanicoId,
        s.driven as descripcionServicio,
        s.date as fechaServicio,
        s.status as estadoServicio,
        -- Datos del mecánico
        u.displayname as mecanicoNombre,
        u.username as mecanicoUsuario,
        u.type as mecanicoTipo,
        -- Datos del tipo de servicio
        st.name as tipoServicioNombre,
        st.description as tipoServicioDescripcion,
        st.price as tipoServicioPrecio
      FROM services s
      LEFT JOIN users u ON s.id_mechanic = u.iduser
      LEFT JOIN serviceTypes st ON s.id_serviceType = st.idserviceTypes
      ORDER BY s.id_case DESC, s.idservices DESC
    `);

    if (serviciosCompletos.length === 0) {
      console.log('❌ No hay servicios registrados');
    } else {
      console.log(`✅ Total de servicios encontrados: ${serviciosCompletos.length}\n`);
      
      serviciosCompletos.forEach((servicio, index) => {
        console.log(`SERVICIO ${index + 1}:`);
        console.log(`  ID del Servicio: ${servicio.servicioId}`);
        console.log(`  ID del Caso Asociado: ${servicio.caseId}`);
        console.log(`  Descripción: ${servicio.descripcionServicio || 'Sin descripción'}`);
        console.log(`  Fecha: ${servicio.fechaServicio}`);
        console.log(`  Estado: ${servicio.estadoServicio}`);
        console.log(`  
  ASIGNACIÓN:`);
        console.log(`    Mecánico: ${servicio.mecanicoNombre} (${servicio.mecanicoUsuario}) - Tipo: ${servicio.mecanicoTipo}`);
        console.log(`    Tipo de Servicio: ${servicio.tipoServicioNombre} - Precio: Q${servicio.tipoServicioPrecio}`);
        console.log(`    Descripción del Servicio: ${servicio.tipoServicioDescripcion}`);
        console.log('-'.repeat(50));
      });
    }

    // 4. Verificar integridad de relaciones
    console.log('\n🔗 VERIFICACIÓN DE INTEGRIDAD DE RELACIONES:');
    console.log('-'.repeat(50));
    
    // Casos con relaciones rotas
    const casosConProblemas = await executeQuery(`
      SELECT 
        c.idcases,
        c.id_vehicle,
        c.id_agent,
        c.id_bill,
        CASE WHEN v.idvehicles IS NULL THEN 'Vehículo no existe' ELSE 'OK' END as vehiculo_status,
        CASE WHEN cl.idclients IS NULL THEN 'Cliente no existe' ELSE 'OK' END as cliente_status,
        CASE WHEN f.idbills IS NULL THEN 'Factura no existe' ELSE 'OK' END as factura_status
      FROM cases c
      LEFT JOIN vehicles v ON c.id_vehicle = v.idvehicles
      LEFT JOIN clients cl ON c.id_agent = cl.idclients
      LEFT JOIN bills f ON c.id_bill = f.idbills
      WHERE v.idvehicles IS NULL OR cl.idclients IS NULL OR f.idbills IS NULL
    `);

    if (casosConProblemas.length === 0) {
      console.log('✅ Todas las relaciones están correctas');
    } else {
      console.log('❌ Se encontraron problemas en las relaciones:');
      casosConProblemas.forEach((problema, i) => {
        console.log(`  ${i + 1}. Caso ID: ${problema.idcases}`);
        console.log(`     Vehículo: ${problema.vehiculo_status}`);
        console.log(`     Cliente: ${problema.cliente_status}`);
        console.log(`     Factura: ${problema.factura_status}`);
      });
    }

    // 5. Resumen estadístico
    console.log('\n📊 RESUMEN ESTADÍSTICO:');
    console.log('-'.repeat(50));
    
    const estadisticas = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM cases) as total_casos,
        (SELECT COUNT(*) FROM services) as total_servicios,
        (SELECT COUNT(*) FROM bills) as total_facturas,
        (SELECT COUNT(*) FROM clients) as total_clientes,
        (SELECT COUNT(*) FROM vehicles) as total_vehiculos,
        (SELECT COUNT(*) FROM users WHERE type = 'MECHANIC') as total_mecanicos
    `);

    const stats = estadisticas[0];
    console.log(`Total de Casos: ${stats.total_casos}`);
    console.log(`Total de Servicios: ${stats.total_servicios}`);
    console.log(`Total de Facturas: ${stats.total_facturas}`);
    console.log(`Total de Clientes: ${stats.total_clientes}`);
    console.log(`Total de Vehículos: ${stats.total_vehiculos}`);
    console.log(`Total de Mecánicos: ${stats.total_mecanicos}`);

    // 6. Últimos casos creados por el módulo de diagnóstico
    console.log('\n🆕 ÚLTIMOS CASOS DE DIAGNÓSTICO:');
    console.log('-'.repeat(50));
    
    const ultimosCasos = await executeQuery(`
      SELECT TOP 3
        c.idcases,
        c.description,
        cl.fullname as cliente,
        v.plate as placa,
        f.amaunt as monto,
        COUNT(s.idservices) as servicios_asignados
      FROM cases c
      LEFT JOIN clients cl ON c.id_agent = cl.idclients
      LEFT JOIN vehicles v ON c.id_vehicle = v.idvehicles
      LEFT JOIN bills f ON c.id_bill = f.idbills
      LEFT JOIN services s ON c.idcases = s.id_case
      WHERE c.description LIKE '%diagnóstico%'
      GROUP BY c.idcases, c.description, cl.fullname, v.plate, f.amaunt
      ORDER BY c.idcases DESC
    `);

    if (ultimosCasos.length > 0) {
      ultimosCasos.forEach((caso, i) => {
        console.log(`  ${i + 1}. Caso ${caso.idcases}: ${caso.cliente} - ${caso.placa} - Q${caso.monto} (${caso.servicios_asignados} servicios)`);
      });
    } else {
      console.log('No se encontraron casos de diagnóstico');
    }

    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
};

// Función específica para verificar un caso por ID
const verificarCasoPorId = async (caseId) => {
  try {
    console.log(`\n🔍 VERIFICANDO CASO ESPECÍFICO: ${caseId}`);
    console.log('-'.repeat(50));

    const casoDetallado = await executeQuery(`
      SELECT 
        c.*,
        cl.fullname as clienteNombre,
        cl.nit as clienteTelefono,
        v.plate as vehiculoPlaca,
        b.name as vehiculoMarca,
        m.name as vehiculoModelo,
        f.amaunt as facturaMontoTotal,
        f.paymentMethod as metodoPago,
        f.creationDate as fechaFactura
      FROM cases c
      LEFT JOIN clients cl ON c.id_agent = cl.idclients
      LEFT JOIN vehicles v ON c.id_vehicle = v.idvehicles
      LEFT JOIN brands b ON v.id_brand = b.idbrands
      LEFT JOIN models m ON v.id_model = m.idmodels
      LEFT JOIN bills f ON c.id_bill = f.idbills
      WHERE c.idcases = @caseId
    `, { caseId });

    if (casoDetallado.length === 0) {
      console.log(`❌ No se encontró el caso con ID: ${caseId}`);
      return;
    }

    const caso = casoDetallado[0];
    console.log('INFORMACIÓN COMPLETA DEL CASO:');
    console.log(`  ID: ${caso.idcases}`);
    console.log(`  Descripción: ${caso.description}`);
    console.log(`  Cliente: ${caso.clienteNombre} (Tel: ${caso.clienteTelefono})`);
    console.log(`  Vehículo: ${caso.vehiculoMarca} ${caso.vehiculoModelo} - Placa: ${caso.vehiculoPlaca}`);
    console.log(`  Factura: Q${caso.facturaMontoTotal} - ${caso.metodoPago} - ${caso.fechaFactura}`);

    // Servicios del caso
    const serviciosDelCaso = await executeQuery(`
      SELECT 
        s.*,
        u.displayname as mecanicoNombre,
        st.name as tipoServicio
      FROM services s
      LEFT JOIN users u ON s.id_mechanic = u.iduser
      LEFT JOIN serviceTypes st ON s.id_serviceType = st.idserviceTypes
      WHERE s.id_case = @caseId
    `, { caseId });

    console.log(`\nSERVICIOS ASIGNADOS (${serviciosDelCaso.length}):`);
    serviciosDelCaso.forEach((servicio, i) => {
      console.log(`  ${i + 1}. ${servicio.tipoServicio} - Mecánico: ${servicio.mecanicoNombre}`);
      console.log(`     Descripción: ${servicio.driven}`);
      console.log(`     Fecha: ${servicio.date} - Estado: ${servicio.status}`);
    });

  } catch (error) {
    console.error('Error verificando caso específico:', error);
  }
};

// Función principal para ejecutar
const ejecutarVerificacion = async () => {
  const { connectDB } = require('./config/database');
  
  try {
    console.log('Conectando a la base de datos...');
    await connectDB();
    console.log('Conexión establecida. Iniciando verificación...\n');
    
    await verificarTablaCase();
    
    // Descomentar para verificar un caso específico
    // await verificarCasoPorId(1); // Reemplaza 1 con el ID del caso que quieres verificar
    
  } catch (error) {
    console.error('Error ejecutando verificación:', error);
  } finally {
    process.exit(0);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarVerificacion();
}

module.exports = { 
  verificarTablaCase, 
  verificarCasoPorId 
};