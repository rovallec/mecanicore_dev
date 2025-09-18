const { executeQuery } = require('./config/database');

const insertarCasoDirecto = async () => {
  try {
    console.log('INSERTANDO CASO DIRECTO CON TUS DATOS');
    console.log('=' .repeat(50));

    // 1. Obtener datos exactos
    const vehiculo = await executeQuery('SELECT TOP 1 idvehicles FROM vehicles ORDER BY idvehicles DESC');
    const bill = await executeQuery('SELECT TOP 1 idbills FROM bills ORDER BY idbills DESC');
    const usuario = await executeQuery('SELECT TOP 1 iduser FROM users ORDER BY iduser');

    console.log('Datos obtenidos:');
    console.log(`id_vehicle: ${vehiculo[0].idvehicles}`);
    console.log(`id_bill: ${bill[0].idbills}`);
    console.log(`id_agent (iduser): ${usuario[0].iduser}`);

    // 2. Insertar caso directo
    console.log('\nInsertando caso...');
    
    await executeQuery(`
      INSERT INTO cases (idcases, id_vehicle, id_agent, id_bill, description)
      VALUES (999, @idVehicle, @idAgent, @idBill, @description)
    `, {
      idVehicle: vehiculo[0].idvehicles,
      idAgent: usuario[0].iduser,  // Este es el valor correcto
      idBill: bill[0].idbills,
      description: 'Caso directo de prueba'
    });

    console.log('✅ Caso insertado con ID: 999');

    // 3. Verificar inserción
    const casoVerif = await executeQuery('SELECT * FROM cases WHERE idcases = 999');
    console.log('\nCaso insertado:');
    console.log(casoVerif[0]);

    // 4. Limpiar
    await executeQuery('DELETE FROM cases WHERE idcases = 999');
    console.log('\nCaso de prueba eliminado');

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nDetalles del error:');
    console.log(`Número: ${error.number}`);
    console.log(`Estado: ${error.state}`);
  }
};

const ejecutar = async () => {
  const { connectDB } = require('./config/database');
  await connectDB();
  await insertarCasoDirecto();
  process.exit(0);
};

ejecutar();