// function.js (esto se ejecuta en Azure, no en el navegador)
const sql = require('mssql');

module.exports = async function (context, req) {
    const config = {
        server: 'azdb020.database.windows.net',
        database: 'devCore',
        user: 'CloudSAefcd62ce',
        password: '@*#!$wFo9JSARp',
        options: { encrypt: true }
    };

    try {
        await sql.connect(config);
        const result = await sql.query('SELECT * FROM Repuestos');
        context.res = { status: 200, body: result.recordset };
    } catch (error) {
        context.res = { status: 500, body: error.message };
    }
};

async function cargarDatos() {
    try {
        const response = await fetch(azdb020.database.windows.net);

        if (!response.ok) {
            throw new Error('Error en la solicitud: ' + response.status);
        }
        const datos = await response.json();
        mostrarDatosEnTabla(datos);
    } catch (error) {
        console.error('Error al cargar los datos:', error); 
        document.getElementById('cuerpo-tabla').innerHTML = '<tr><td colspan="4">Error al cargar los datos</td></tr>';
    }
}

function mostrarDatosEnTabla(datos) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla');
    if (datos.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="4">No hay datos disponibles</td></tr>';
        return;
    }
    cuerpoTabla.innerHTML = datos.map(item => ` 
        <tr>
            <td>${item.tipo_producto || ''}</td>
            <td>${item.nombre || ''}</td>
            <td>${item.descripcion || ''}</td>
            <td>${item.existencias || ''}</td>
        </tr>
    `).join('');
}

// Cargar datos cuando la página esté lista
document.addEventListener('DOMContentLoaded', cargarDatos);

// Opcional: Recargar datos cada 60 segundos
setInterval(cargarDatos, 60000);


<script>
const API_URL = 'https://tu-function.azurewebsites.net/api/tu-function';

async function cargarDatos() {
    try {
        const response = await fetch(API_URL);
        const datos = await response.json();
        
        // Llenar la tabla con los datos
        const tabla = document.getElementById('tabla-datos');
        datos.forEach(item => {
            const fila = tabla.insertRow();
            fila.insertCell(0).textContent = item.id;
            fila.insertCell(1).textContent = item.nombre;
            fila.insertCell(2).textContent = item.stock;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Cargar datos cuando la página cargue
window.onload = cargarDatos;
</script>

<table id="tabla-datos">
    <thead>
        <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Stock</th>
        </tr>
    </thead>
    <tbody></tbody>
</table>



