const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB, closeDB, checkConnection } = require('./config/database');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5001;

// CORS - permitir conexiones desde el frontend
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middlewares de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'API del Taller Mecánico',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      clientes: '/api/clientes',
      vehiculos: '/api/vehiculos',
      servicios: '/api/servicios',
      ingresos: '/api/ingresos'
    }
  });
});

// Ruta de health check
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await checkConnection();
    
    res.json({
      status: 'OK',
      database: dbStatus ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// *** RUTAS DE LA API - HABILITADAS ***
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/vehiculos', require('./routes/vehiculos'));
app.use('/api/servicios', require('./routes/servicios'));
app.use('/api/ingresos', require('./routes/ingresos'));
app.use('/api/diagnostico', require('./routes/diagnostico'));
app.use('/api/mecanicos', require('./routes/mecanicos'));

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/auth/current-user',
      'GET /api/clientes',
      'GET /api/vehiculos',
      'GET /api/servicios',
      'GET /api/ingresos'
    ]
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  // Error de SQL Server
  if (error.number) {
    return res.status(500).json({
      error: 'Error de base de datos',
      message: 'Error interno del servidor',
      code: error.number,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
  
  // Error de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: error.message
    });
  }
  
  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Algo salió mal',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    console.log('Iniciando servidor del taller mecánico...');
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // Conectar a la base de datos
    const connected = await connectDB();
    
    if (!connected) {
      console.log('Advertencia: Servidor iniciando sin conexión a la base de datos');
      console.log('El servidor funcionará con datos simulados hasta que se conecte la BD');
    }
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('==========================================');
      console.log('🚀 SERVIDOR INICIADO EXITOSAMENTE');
      console.log('==========================================');
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🗄️ Base de datos: ${connected ? 'Conectada ✅' : 'Desconectada ⚠️'}`);
      console.log('📚 Endpoints disponibles:');
      console.log(`   - Health: http://localhost:${PORT}/health`);
      console.log(`   - API Info: http://localhost:${PORT}/`);
      console.log(`   - Auth: http://localhost:${PORT}/api/auth/current-user`);
      console.log(`   - Clientes: http://localhost:${PORT}/api/clientes`);
      console.log(`   - Vehículos: http://localhost:${PORT}/api/vehiculos`);
      console.log(`   - Servicios: http://localhost:${PORT}/api/servicios`);
      console.log(`   - Ingresos: http://localhost:${PORT}/api/ingresos`);
      console.log('==========================================');
      console.log('Presiona Ctrl+C para detener el servidor');
    });
    
    // Manejo graceful de cierre del servidor
    const gracefulShutdown = async (signal) => {
      console.log(`\nRecibida señal ${signal}. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('Servidor HTTP cerrado');
        
        // Cerrar conexión de base de datos
        await closeDB();
        
        console.log('Cierre graceful completado');
        process.exit(0);
      });
      
      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.log('Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };
    
    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('Error crítico iniciando el servidor:', error.message);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection en:', promise, 'razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar el servidor
if (require.main === module) {
  startServer();
}

module.exports = app;