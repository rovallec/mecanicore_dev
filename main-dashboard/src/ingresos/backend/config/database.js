const sql = require('mssql');

// Connection string desde Visual Studio Code
const connectionString = "Data Source=azdb020.database.windows.net;Initial Catalog=devCore;User ID=CloudSAefcd62ce;Password=@*#!$wFo9JSARp;Pooling=True;Connect Timeout=30;Encrypt=True;Authentication=SqlPassword;Application Name=taller-mecanico-backend;Command Timeout=30";

let pool = null;

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    console.log('Conectando a SQL Server con connection string...');
    
    // Usar el connection string directo
    pool = await sql.connect(connectionString);
    
    // Verificar conexión
    const result = await pool.request().query('SELECT 1 as test');
    console.log('Conectado a SQL Server exitosamente');
    console.log('Conexión verificada:', result.recordset);
    
    return true;
  } catch (error) {
    console.error('Error conectando:', error.message);
    return false;
  }
};

// Función para cerrar conexión
const closeDB = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Conexión cerrada');
    }
  } catch (error) {
    console.error('Error cerrando conexión:', error.message);
  }
};

// Función para obtener el pool de conexiones
const getPool = () => {
  if (!pool) {
    throw new Error('Base de datos no conectada');
  }
  return pool;
};

// Función helper para ejecutar consultas
const executeQuery = async (query, params = {}) => {
  try {
    const currentPool = getPool();
    const request = currentPool.request();
    
    // Agregar parámetros si existen
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error ejecutando consulta:', error.message);
    throw error;
  }
};

// Función para verificar el estado de la conexión
const checkConnection = async () => {
  try {
    const result = await executeQuery('SELECT 1 as status');
    return result.length > 0;
  } catch (error) {
    return false;
  }
};

module.exports = {
  sql,
  connectDB,
  closeDB,
  getPool,
  executeQuery,
  checkConnection
};