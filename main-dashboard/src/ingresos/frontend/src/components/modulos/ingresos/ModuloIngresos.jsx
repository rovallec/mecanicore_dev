import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Calendar, User, Car, FileText, Trash2 } from 'lucide-react';
import { clientesAPI, vehiculosAPI, serviciosAPI, ingresosAPI, authAPI } from '../../../services/api';

const ModuloIngresos = () => {
  // Estados para datos de la API
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [serviciosTipos, setServiciosTipos] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState({ nombre: 'Usuario Sistema' });

  // Estados para el formulario
  const [formData, setFormData] = useState({
    cliente: null,
    vehiculo: null,
    fecha: new Date().toISOString().split('T')[0],
    agente: 'Usuario Sistema',
    descripcion: '',
    servicios: []
  });

  // Estados para los popups
  const [showClientePopup, setShowClientePopup] = useState(false);
  const [showVehiculoPopup, setShowVehiculoPopup] = useState(false);
  const [showServiciosPopup, setShowServiciosPopup] = useState(false);

  // Estados para búsqueda
  const [clienteSearch, setClienteSearch] = useState('');
  const [vehiculoSearch, setVehiculoSearch] = useState('');
  const [servicioSearch, setServicioSearch] = useState('');

  // Estados de carga
  const [loading, setLoading] = useState(false);

  // Función para cargar usuario actual
  const loadUsuarioActual = async () => {
    try {
      console.log('🔍 Intentando cargar usuario actual...');
      const usuarioResponse = await authAPI.getCurrentUser();
      console.log('✅ Respuesta del usuario:', usuarioResponse);
      
      const usuario = usuarioResponse.data;
      const nombreUsuario = usuario.nombre || usuario.displayname || usuario.usuario || 'Usuario Desconocido';
      
      console.log('👤 Usuario cargado:', nombreUsuario);
      
      setUsuarioActual(usuario);
      setFormData(prev => ({ 
        ...prev, 
        agente: nombreUsuario
      }));
      
    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
      const defaultUser = { id: 1, nombre: 'Usuario Sistema' };
      setUsuarioActual(defaultUser);
      setFormData(prev => ({ ...prev, agente: defaultUser.nombre }));
    }
  };

  // Cargar datos cuando se monta el componente
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        console.log('Cargando datos...');
        
        // Cargar datos en paralelo
        const [clientesResponse, serviciosResponse] = await Promise.all([
          clientesAPI.getAll(),
          serviciosAPI.getAll()
        ]);
        
        // Debug: Ver qué devuelve la API
        console.log('Respuesta de clientes:', clientesResponse);
        console.log('Datos de clientes:', clientesResponse.data);
        console.log('Es array clientes?', Array.isArray(clientesResponse.data));
        console.log('Respuesta de servicios:', serviciosResponse);
        console.log('Datos de servicios:', serviciosResponse.data);
        console.log('Es array servicios?', Array.isArray(serviciosResponse.data));
        
        // Extraer el array 'data' de cada respuesta
        setClientes(Array.isArray(clientesResponse.data) ? clientesResponse.data : []);
        setServiciosTipos(Array.isArray(serviciosResponse.data) ? serviciosResponse.data : []);
        
        // AQUÍ ESTABA LA FALLA: Cargar usuario actual
        await loadUsuarioActual();
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        // En caso de error, asegurar arrays vacíos
        setClientes([]);
        setServiciosTipos([]);
        alert('Error al cargar datos iniciales: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Filtros para búsquedas con verificaciones de seguridad
  const clientesFiltrados = Array.isArray(clientes) ? clientes.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    cliente.telefono?.includes(clienteSearch)
  ) : [];

  const vehiculosBusqueda = Array.isArray(vehiculos) ? vehiculos.filter(vehiculo =>
    vehiculo.marca?.toLowerCase().includes(vehiculoSearch.toLowerCase()) ||
    vehiculo.modelo?.toLowerCase().includes(vehiculoSearch.toLowerCase()) ||
    vehiculo.placa?.toLowerCase().includes(vehiculoSearch.toLowerCase())
  ) : [];

  const serviciosFiltrados = Array.isArray(serviciosTipos) ? serviciosTipos.filter(servicio =>
    servicio.nombre?.toLowerCase().includes(servicioSearch.toLowerCase()) ||
    servicio.descripcion?.toLowerCase().includes(servicioSearch.toLowerCase())
  ) : [];

  // Handlers para selecciones
  const handleClienteSelect = async (cliente) => {
    setFormData(prev => ({ ...prev, cliente, vehiculo: null }));
    setShowClientePopup(false);
    setClienteSearch('');
    
    // Cargar vehículos del cliente seleccionado
    try {
      console.log('Cargando vehículos para cliente:', cliente.id);
      const vehiculosResponse = await vehiculosAPI.getByCliente(cliente.id);
      console.log('Respuesta de vehículos:', vehiculosResponse);
      console.log('Vehículos cargados:', vehiculosResponse.data);
      setVehiculos(Array.isArray(vehiculosResponse.data) ? vehiculosResponse.data : []);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      setVehiculos([]);
      alert('Error al cargar vehículos: ' + error.message);
    }
  };

  const handleVehiculoSelect = (vehiculo) => {
    setFormData(prev => ({ ...prev, vehiculo }));
    setShowVehiculoPopup(false);
    setVehiculoSearch('');
  };

  const handleServicioAdd = (servicio) => {
    if (!formData.servicios.find(s => s.id === servicio.id)) {
      setFormData(prev => ({
        ...prev,
        servicios: [...prev.servicios, servicio]
      }));
    }
    setShowServiciosPopup(false);
    setServicioSearch('');
  };

  const handleServicioRemove = (servicioId) => {
    setFormData(prev => ({
      ...prev,
      servicios: prev.servicios.filter(s => s.id !== servicioId)
    }));
  };

  const calcularTotal = () => {
    return formData.servicios.reduce((sum, servicio) => sum + (servicio.precio || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente || !formData.vehiculo || formData.servicios.length === 0) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }
    
    setLoading(true);
    try {
      const ingresoData = {
        clienteId: formData.cliente.id,
        vehiculoId: formData.vehiculo.id,
        fecha: formData.fecha,
        agente: formData.agente,
        descripcion: formData.descripcion,
        servicios: formData.servicios.map(s => s.id),
        total: calcularTotal()
      };
      
      console.log('Enviando datos del ingreso:', ingresoData);
      const resultado = await ingresosAPI.create(ingresoData);
      console.log('Ingreso creado:', resultado);
      alert('¡Ingreso registrado exitosamente!');
      
      // Limpiar formulario
      handleLimpiar();
    } catch (error) {
      console.error('Error al registrar ingreso:', error);
      alert('Error al registrar el ingreso: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setFormData({
      cliente: null,
      vehiculo: null,
      fecha: new Date().toISOString().split('T')[0],
      agente: usuarioActual.nombre || usuarioActual.displayname || usuarioActual.usuario || 'Usuario Sistema',
      descripcion: '',
      servicios: []
    });
    setVehiculos([]);
    setClienteSearch('');
    setVehiculoSearch('');
    setServicioSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Ingreso</h1>
          <p className="text-gray-600">Complete la información del vehículo que ingresa al taller</p>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Cliente <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowClientePopup(true)}
                  disabled={loading}
                  className="w-full p-3 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                >
                  {formData.cliente ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{formData.cliente.nombre}</p>
                        <p className="text-sm text-gray-500">{formData.cliente.telefono}</p>
                      </div>
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Seleccionar cliente...</span>
                      <Search className="h-4 w-4" />
                    </div>
                  )}
                </button>
              </div>

              {/* Vehículo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Car className="inline h-4 w-4 mr-1" />
                  Vehículo <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => formData.cliente ? setShowVehiculoPopup(true) : alert('Primero seleccione un cliente')}
                  disabled={!formData.cliente || loading}
                  className={`w-full p-3 border rounded-lg text-left transition-colors ${
                    formData.cliente && !loading
                      ? 'border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  {formData.vehiculo ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{formData.vehiculo.marca} {formData.vehiculo.modelo}</p>
                        <p className="text-sm text-gray-500">Placa: {formData.vehiculo.placa} - Año: {formData.vehiculo.año}</p>
                      </div>
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-gray-500">
                      <span>{formData.cliente ? 'Seleccionar vehículo...' : 'Primero seleccione un cliente'}</span>
                      <Search className="h-4 w-4" />
                    </div>
                  )}
                </button>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Agente */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Agente Responsable
                </label>
                <input
                  type="text"
                  value={formData.agente}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Servicios */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Servicios <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowServiciosPopup(true)}
                  disabled={loading}
                  className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-center bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-600 disabled:opacity-50"
                >
                  <Plus className="h-5 w-5 mx-auto mb-1" />
                  Agregar Servicios
                </button>
                
                {/* Lista de servicios seleccionados */}
                {formData.servicios.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.servicios.map((servicio) => (
                      <div key={servicio.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{servicio.nombre}</p>
                          <p className="text-sm text-gray-600">{servicio.descripcion}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-green-600">Q{(servicio.precio || 0).toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => handleServicioRemove(servicio.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg font-bold text-lg">
                      <span>Total Estimado:</span>
                      <span className="text-green-600">Q{calcularTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción/Observaciones
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describa el problema o solicitud del cliente..."
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleLimpiar}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.cliente || !formData.vehiculo || formData.servicios.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors font-medium disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                'Registrar Ingreso'
              )}
            </button>
          </div>
        </form>

        {/* Popup de Clientes */}
        {showClientePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-96 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Seleccionar Cliente</h3>
                <button
                  onClick={() => setShowClientePopup(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre o teléfono..."
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4 pt-0">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => handleClienteSelect(cliente)}
                      className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">{cliente.nombre}</p>
                      <p className="text-sm text-gray-600">{cliente.telefono}</p>
                      {cliente.email && <p className="text-sm text-gray-500">{cliente.email}</p>}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No se encontraron clientes</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popup de Vehículos */}
        {showVehiculoPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-96 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Seleccionar Vehículo</h3>
                <button
                  onClick={() => setShowVehiculoPopup(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo o placa..."
                  value={vehiculoSearch}
                  onChange={(e) => setVehiculoSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4 pt-0">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : vehiculosBusqueda.length > 0 ? (
                  vehiculosBusqueda.map((vehiculo) => (
                    <button
                      key={vehiculo.id}
                      onClick={() => handleVehiculoSelect(vehiculo)}
                      className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">{vehiculo.marca} {vehiculo.modelo}</p>
                      <p className="text-sm text-gray-600">Placa: {vehiculo.placa} - Año: {vehiculo.año}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No se encontraron vehículos</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popup de Servicios */}
        {showServiciosPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-96 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Seleccionar Servicios</h3>
                <button
                  onClick={() => setShowServiciosPopup(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={servicioSearch}
                  onChange={(e) => setServicioSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4 pt-0">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : serviciosFiltrados.length > 0 ? (
                  serviciosFiltrados.map((servicio) => {
                    const yaSeleccionado = formData.servicios.find(s => s.id === servicio.id);
                    return (
                      <button
                        key={servicio.id}
                        onClick={() => !yaSeleccionado && handleServicioAdd(servicio)}
                        disabled={yaSeleccionado}
                        className={`w-full p-3 text-left rounded-lg border-b border-gray-100 last:border-b-0 ${
                          yaSeleccionado 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{servicio.nombre}</p>
                            <p className="text-sm text-gray-600">{servicio.descripcion}</p>
                          </div>
                          <div className="ml-2">
                            <p className="font-bold text-green-600">Q{(servicio.precio || 0).toFixed(2)}</p>
                            {yaSeleccionado && (
                              <p className="text-xs text-gray-500">Ya agregado</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">No se encontraron servicios</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuloIngresos;