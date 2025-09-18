const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const serviceTypeRoutes = require('./routes/serviceTypes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a la base de datos
connectDB().catch(console.error);

// Rutas
app.use('/api/service-types', serviceTypeRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API de Tipos de Servicios funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});