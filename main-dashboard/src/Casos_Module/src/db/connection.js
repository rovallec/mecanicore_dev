require('dotenv').config(); 
const sql = require('mssql'); 

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', 
        trustServerCertificate: true 
    }
};

async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log('✅ Conexión a la base de datos exitosa.');
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
        process.exit(1); 
    }
}


module.exports = {
    sql,
    connectDB
};