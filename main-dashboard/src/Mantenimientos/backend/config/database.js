const sql = require('mssql');

const config = {
  server: 'azdb020.database.windows.net',
  user: 'CloudSAefcd62ce',
  password: '@*#!$wFo9JSARp',
  database: 'devCore',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('Conectado a SQL Server');
    }
    return pool;
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    throw error;
  }
};

const getPool = () => {
  return pool;
};

module.exports = { connectDB, getPool, sql };