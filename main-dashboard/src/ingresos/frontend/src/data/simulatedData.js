// Datos simulados para el frontend
// Estos datos serán reemplazados por llamadas a la API cuando el backend esté listo

export const clientes = [
  { 
    id: 1, 
    nombre: 'Carlos González', 
    telefono: '555-0101', 
    email: 'carlos@email.com', 
    direccion: 'Av. Principal 123' 
  },
  { 
    id: 2, 
    nombre: 'María López', 
    telefono: '555-0102', 
    email: 'maria@email.com', 
    direccion: 'Calle Secundaria 456' 
  },
  { 
    id: 3, 
    nombre: 'Roberto Martínez', 
    telefono: '555-0103', 
    email: 'roberto@email.com', 
    direccion: 'Blvd. Central 789' 
  },
  { 
    id: 4, 
    nombre: 'Ana Rodríguez', 
    telefono: '555-0104', 
    email: 'ana@email.com', 
    direccion: 'Av. Norte 321' 
  },
  { 
    id: 5, 
    nombre: 'Luis Hernández', 
    telefono: '555-0105', 
    email: 'luis@email.com', 
    direccion: 'Calle Sur 654' 
  }
];

export const vehiculos = [
  { 
    id: 1, 
    marca: 'Toyota', 
    modelo: 'Corolla', 
    año: 2020, 
    placa: 'ABC-123', 
    clienteId: 1 
  },
  { 
    id: 2, 
    marca: 'Honda', 
    modelo: 'Civic', 
    año: 2019, 
    placa: 'DEF-456', 
    clienteId: 1 
  },
  { 
    id: 3, 
    marca: 'Ford', 
    modelo: 'Focus', 
    año: 2021, 
    placa: 'GHI-789', 
    clienteId: 2 
  },
  { 
    id: 4, 
    marca: 'Nissan', 
    modelo: 'Sentra', 
    año: 2018, 
    placa: 'JKL-012', 
    clienteId: 3 
  },
  { 
    id: 5, 
    marca: 'Chevrolet', 
    modelo: 'Cruze', 
    año: 2022, 
    placa: 'MNO-345', 
    clienteId: 4 
  },
  { 
    id: 6, 
    marca: 'Volkswagen', 
    modelo: 'Jetta', 
    año: 2020, 
    placa: 'PQR-678', 
    clienteId: 5 
  }
];

export const serviciosTipos = [
  { 
    id: 1, 
    nombre: 'Cambio de Aceite', 
    descripcion: 'Cambio de aceite y filtro', 
    precio: 250.00 
  },
  { 
    id: 2, 
    nombre: 'Alineación', 
    descripcion: 'Alineación y balanceo', 
    precio: 400.00 
  },
  { 
    id: 3, 
    nombre: 'Frenos', 
    descripcion: 'Revisión y cambio de frenos', 
    precio: 800.00 
  },
  { 
    id: 4, 
    nombre: 'Transmisión', 
    descripcion: 'Servicio de transmisión', 
    precio: 1200.00 
  },
  { 
    id: 5, 
    nombre: 'Diagnóstico', 
    descripcion: 'Diagnóstico computarizado', 
    precio: 150.00 
  },
  { 
    id: 6, 
    nombre: 'Llantas', 
    descripcion: 'Cambio de llantas', 
    precio: 2000.00 
  },
  { 
    id: 7, 
    nombre: 'Aire Acondicionado', 
    descripcion: 'Mantenimiento de A/C', 
    precio: 350.00 
  },
  { 
    id: 8, 
    nombre: 'Batería', 
    descripcion: 'Cambio de batería', 
    precio: 450.00 
  }
];

// Usuario logueado simulado
export const usuarioActual = {
  id: 1,
  nombre: 'Juan Pérez',
  rol: 'RECEPCIONISTA',
  email: 'juan@tallermecánico.com'
};