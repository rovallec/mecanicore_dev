import axios from 'axios';

const API_URL = 'http://localhost:5001/api/service-types';

const serviceTypeService = {
  // Obtener todos los tipos de servicios
  getAllServiceTypes: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipos de servicios');
    }
  },

  // Obtener tipo de servicio por ID
  getServiceTypeById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipo de servicio');
    }
  },

  // Crear nuevo tipo de servicio
  createServiceType: async (serviceTypeData) => {
    try {
      const response = await axios.post(API_URL, serviceTypeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear tipo de servicio');
    }
  },

  // Actualizar tipo de servicio
  updateServiceType: async (id, serviceTypeData) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, serviceTypeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar tipo de servicio');
    }
  },

  // Eliminar tipo de servicio
  deleteServiceType: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar tipo de servicio');
    }
  },

  // Buscar tipos de servicios
  searchServiceTypes: async (query) => {
    try {
      const response = await axios.get(`${API_URL}/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al buscar tipos de servicios');
    }
  }
};

export default serviceTypeService;