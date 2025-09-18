// Middleware personalizado de CORS para el taller mecánico

const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',  // Frontend en desarrollo
      'http://localhost:3001',  // Frontend alternativo
      process.env.FRONTEND_URL  // URL del frontend desde .env
    ].filter(Boolean); // Filtrar valores undefined/null
    
    // Permitir requests sin origin (como Postman, aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  
  credentials: true, // Permitir cookies y headers de autenticación
  
  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS'
  ],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token'
  ],
  
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page'
  ],
  
  maxAge: 86400 // 24 horas de cache para preflight requests
};

module.exports = corsOptions;