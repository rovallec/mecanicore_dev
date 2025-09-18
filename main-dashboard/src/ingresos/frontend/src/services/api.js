// Servicio para comunicarse con el backend
const API_BASE_URL = 'http://localhost:5001/api';

// Función helper para hacer requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`📄 API Request: ${config.method} ${url}`);

    const response = await fetch(url, config);
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Response data:`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Error - ${endpoint}:`, error.message);
    throw error;
  }
};

// Servicios de autenticación
export const authAPI = {
  getCurrentUser: () => apiRequest('/auth/current-user'),
};

// Servicios de clientes
export const clientesAPI = {
  getAll: () => apiRequest('/clientes'),
  getById: (id) => apiRequest(`/clientes/${id}`),
  create: (data) => apiRequest('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  search: (query) => apiRequest(`/clientes/search?q=${encodeURIComponent(query)}`),
};

// Servicios de vehículos
export const vehiculosAPI = {
  getAll: () => apiRequest('/vehiculos'),
  getByCliente: (clienteId) => apiRequest(`/vehiculos/cliente/${clienteId}`),
  getById: (id) => apiRequest(`/vehiculos/${id}`),
  create: (data) => apiRequest('/vehiculos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/vehiculos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getMarcas: () => apiRequest('/vehiculos/marcas'),
};

// Servicios de servicios
export const serviciosAPI = {
  getAll: () => apiRequest('/servicios'),
  getById: (id) => apiRequest(`/servicios/${id}`),
  create: (data) => apiRequest('/servicios', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/servicios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  search: (query) => apiRequest(`/servicios/search?q=${encodeURIComponent(query)}`),
};

// Servicios de ingresos
export const ingresosAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/ingresos${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/ingresos/${id}`),
  create: (data) => apiRequest('/ingresos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/ingresos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateEstado: (id, estado) => apiRequest(`/ingresos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  }),
};

// Función para verificar conexión con el backend
export const checkBackendConnection = async () => {
  try {
    const response = await fetch('http://localhost:5001/health');
    return response.ok;
  } catch (error) {
    console.error('Backend no disponible:', error.message);
    return false;
  }
};