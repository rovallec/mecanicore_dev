const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db/connection');

const casesRoutes = require('./routes/cases.routes');

const app = express();
connectDB(); 

app.use(cors()); 
app.use(express.json()); 

app.get('/ping', (req, res) => res.send('pong')); 

app.use('/api/cases', casesRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});