import React, { useState } from 'react';
import { Search, User, Car, FileText, CreditCard, AlertCircle, CheckCircle, Plus } from 'lucide-react';

const ModuloDiagnostico = () => {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState({
    telefono: '',
    placa: '',
    cliente: null,
    vehiculo: null,
    facturasPendientes: [],
    requiereRegistro: false,
    montoDiagnostico: 150.00,
    mecanicoSeleccionado: ''
  });

  // Estado para mecánicos
  const [mecanicos, setMecanicos] = useState([]);

  // Estados para el formulario de registro
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    marca: '',
    modelo: '',
    placa: '',
    año: new Date().getFullYear(),
    notas: ''
  });

  // Función para cargar mecánicos
  const cargarMecanicos = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/mecanicos');
      if (!response.ok) throw new Error('Error al obtener mecánicos');
      
      const data = await response.json();
      setMecanicos(data.data || []);
      
      // Seleccionar el primer mecánico por defecto si existe
      if (data.data && data.data.length > 0) {
        setDatos(prev => ({ ...prev, mecanicoSeleccionado: data.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error cargando mecánicos:', error);
      setMecanicos([]);
    }
  };
  const buscarCliente = async (telefono) => {
    try {
      const response = await fetch('http://localhost:5001/api/clientes');
      if (!response.ok) throw new Error('Error al obtener clientes');
      
      const data = await response.json();
      const clientes = data.data || [];
      
      // Buscar cliente por teléfono/NIT
      const clienteEncontrado = clientes.find(cliente => 
        cliente.telefono === telefono || cliente.telefono === telefono.trim()
      );
      
      return clienteEncontrado || null;
    } catch (error) {
      console.error('Error buscando cliente:', error);
      return null;
    }
  };

  // Función para buscar vehículo usando fetch directo
  const buscarVehiculo = async (placa) => {
    try {
      const response = await fetch('http://localhost:5001/api/vehiculos');
      if (!response.ok) throw new Error('Error al obtener vehículos');
      
      const data = await response.json();
      const vehiculos = data.data || [];
      
      // Buscar vehículo por placa
      const vehiculoEncontrado = vehiculos.find(vehiculo => 
        vehiculo.placa?.toUpperCase() === placa.toUpperCase()
      );
      
      return vehiculoEncontrado || null;
    } catch (error) {
      console.error('Error buscando vehículo:', error);
      return null;
    }
  };

  const handleBusqueda = async () => {
    if (!datos.telefono && !datos.placa) {
      alert('Debe ingresar al menos el teléfono o la placa del vehículo');
      return;
    }

    setLoading(true);
    try {
      let cliente = null;
      let vehiculo = null;

      // Buscar cliente por teléfono si se proporcionó
      if (datos.telefono) {
        cliente = await buscarCliente(datos.telefono);
      }

      // Buscar vehículo por placa si se proporcionó
      if (datos.placa) {
        vehiculo = await buscarVehiculo(datos.placa);
        
        // Si encontramos vehículo pero no cliente, usar el cliente del vehículo
        if (vehiculo && !cliente && vehiculo.clienteId) {
          try {
            const response = await fetch(`http://localhost:5001/api/clientes/${vehiculo.clienteId}`);
            if (response.ok) {
              const clienteData = await response.json();
              cliente = clienteData.data;
            }
          } catch (error) {
            console.error('Error obteniendo cliente del vehículo:', error);
          }
        }
      }

      // Verificar facturas pendientes si tenemos cliente
      let facturasPendientes = [];
      if (cliente) {
        try {
          const response = await fetch(`http://localhost:5001/api/diagnostico/verificar-cliente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telefono: cliente.telefono,
              placa: vehiculo?.placa
            })
          });
          
          if (response.ok) {
            const resultado = await response.json();
            facturasPendientes = resultado.data.facturasPendientes || [];
          }
        } catch (error) {
          console.error('Error verificando facturas:', error);
        }
      }

      // Determinar si requiere registro
      const requiereRegistro = !cliente || !vehiculo;

      setDatos(prev => ({
        ...prev,
        cliente,
        vehiculo,
        facturasPendientes,
        requiereRegistro
      }));

      setPaso(2);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      alert('Error al buscar cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearFactura = async () => {
    if (!datos.cliente || !datos.vehiculo) {
      alert('Faltan datos del cliente o vehículo');
      return;
    }

    if (!datos.mecanicoSeleccionado) {
      alert('Debe seleccionar un mecánico para el diagnóstico');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/diagnostico/crear-factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: datos.cliente.id,
          vehiculoId: datos.vehiculo.id,
          montoDiagnostico: datos.montoDiagnostico,
          metodoPago: 'EFECTIVO',
          mecanicoId: datos.mecanicoSeleccionado
        })
      });

      const resultado = await response.json();
      
      if (!response.ok) {
        throw new Error(resultado.message || 'Error al crear factura');
      }

      const mecanicoNombre = mecanicos.find(m => m.id.toString() === datos.mecanicoSeleccionado)?.nombre || 'N/A';
      
      alert(`¡Factura de diagnóstico creada exitosamente!\nMecánico asignado: ${mecanicoNombre}`);
      
      // Reiniciar el flujo
      setPaso(1);
      setDatos({
        telefono: '',
        placa: '',
        cliente: null,
        vehiculo: null,
        facturasPendientes: [],
        requiereRegistro: false,
        montoDiagnostico: 150.00,
        mecanicoSeleccionado: ''
      });
      setMecanicos([]);
    } catch (error) {
      console.error('Error creando factura:', error);
      alert('Error al crear factura: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoRegistro = () => {
    // Pre-llenar con datos de búsqueda si están disponibles
    if (datos.telefono && !datos.cliente) {
      setNuevoCliente(prev => ({ ...prev, telefono: datos.telefono }));
    }
    if (datos.placa && !datos.vehiculo) {
      setNuevoVehiculo(prev => ({ ...prev, placa: datos.placa }));
    }
    setPaso(3);
  };

  const validarFormularioRegistro = () => {
    // Si necesita registrar cliente
    if (!datos.cliente) {
      if (!nuevoCliente.nombre.trim() || !nuevoCliente.telefono.trim()) {
        return false;
      }
    }
    
    // Si necesita registrar vehículo
    if (!datos.vehiculo) {
      if (!nuevoVehiculo.marca.trim() || !nuevoVehiculo.modelo.trim() || !nuevoVehiculo.placa.trim()) {
        return false;
      }
    }
    
    return true;
  };

  const handleRegistrarClienteVehiculo = async () => {
    setLoading(true);
    try {
      let clienteId = datos.cliente?.id;
      let vehiculoId = datos.vehiculo?.id;

      // Registrar cliente si es necesario
      if (!datos.cliente) {
        const response = await fetch('http://localhost:5001/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nuevoCliente.nombre.trim(),
            telefono: nuevoCliente.telefono.trim(),
            email: nuevoCliente.email.trim() || null,
            direccion: nuevoCliente.direccion.trim() || null
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al registrar cliente');
        }

        const clienteCreado = await response.json();
        clienteId = clienteCreado.data.id;
        
        // Actualizar estado local
        setDatos(prev => ({
          ...prev,
          cliente: clienteCreado.data
        }));
      }

      // Registrar vehículo si es necesario
      if (!datos.vehiculo) {
        const response = await fetch('http://localhost:5001/api/vehiculos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marca: nuevoVehiculo.marca.trim(),
            modelo: nuevoVehiculo.modelo.trim(),
            placa: nuevoVehiculo.placa.trim(),
            clienteId: clienteId,
            notas: nuevoVehiculo.notas.trim() || null
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al registrar vehículo');
        }

        const vehiculoCreado = await response.json();
        vehiculoId = vehiculoCreado.data.id;
        
        // Actualizar estado local
        setDatos(prev => ({
          ...prev,
          vehiculo: vehiculoCreado.data
        }));
      }

      // Continuar al paso de facturación
      setPaso(4);
      
      // Cargar mecánicos cuando llegamos al paso 4
      await cargarMecanicos();
      
    } catch (error) {
      console.error('Error en registro:', error);
      alert('Error al registrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagnóstico de Vehículo</h1>
          <p className="text-gray-600">Gestión de diagnósticos y facturación para clientes</p>
          
          {/* Indicador de pasos */}
          <div className="flex items-center mt-4 space-x-4">
            <div className={`flex items-center space-x-2 ${paso >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${paso >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>1</div>
              <span>Búsqueda</span>
            </div>
            <div className={`flex items-center space-x-2 ${paso >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${paso >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>2</div>
              <span>Verificación</span>
            </div>
            <div className={`flex items-center space-x-2 ${paso >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${paso >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>3</div>
              <span>Registro</span>
            </div>
            <div className={`flex items-center space-x-2 ${paso >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${paso >= 4 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>4</div>
              <span>Facturación</span>
            </div>
          </div>
        </div>

        {/* Paso 1: Búsqueda inicial */}
        {paso === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Buscar Cliente/Vehículo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Teléfono/NIT del Cliente
                </label>
                <input
                  type="text"
                  value={datos.telefono}
                  onChange={(e) => setDatos(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese teléfono o NIT..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Car className="inline h-4 w-4 mr-1" />
                  Placa del Vehículo
                </label>
                <input
                  type="text"
                  value={datos.placa}
                  onChange={(e) => setDatos(prev => ({ ...prev, placa: e.target.value.toUpperCase() }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese placa..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleBusqueda}
                disabled={loading || (!datos.telefono && !datos.placa)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors font-medium disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Los otros pasos permanecen igual que antes... */}
        {/* Paso 2: Verificación */}
        {paso === 2 && (
          <div className="space-y-6">
            {/* Información del cliente */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Cliente</h2>
              
              {datos.cliente ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Cliente encontrado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Nombre:</strong> {datos.cliente.nombre}</div>
                    <div><strong>Teléfono:</strong> {datos.cliente.telefono}</div>
                    <div><strong>Email:</strong> {datos.cliente.email || 'No registrado'}</div>
                    <div><strong>Dirección:</strong> {datos.cliente.direccion || 'No registrada'}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">Cliente no encontrado - Requiere registro</span>
                  </div>
                </div>
              )}
            </div>

            {/* Información del vehículo */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Vehículo</h2>
              
              {datos.vehiculo ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Vehículo encontrado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Marca:</strong> {datos.vehiculo.marca}</div>
                    <div><strong>Modelo:</strong> {datos.vehiculo.modelo}</div>
                    <div><strong>Placa:</strong> {datos.vehiculo.placa}</div>
                    <div><strong>Cliente:</strong> {datos.vehiculo.clienteNombre}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">Vehículo no encontrado - Requiere registro</span>
                  </div>
                </div>
              )}
            </div>

            {/* Facturas pendientes */}
            {datos.facturasPendientes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Facturas Existentes</h2>
                <div className="space-y-3">
                  {datos.facturasPendientes.map((factura, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><strong>ID:</strong> {factura.id}</div>
                        <div><strong>Monto:</strong> Q{factura.monto.toFixed(2)}</div>
                        <div><strong>Fecha:</strong> {new Date(factura.fechaCreacion).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-between">
              <button
                onClick={() => setPaso(1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Volver
              </button>
              
              <div className="space-x-4">
                {datos.requiereRegistro && (
                  <button
                    onClick={handleNuevoRegistro}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2 inline" />
                    Registrar Cliente/Vehículo
                  </button>
                )}
                
                {!datos.requiereRegistro && (
                  <button
                    onClick={async () => {
                      setPaso(4);
                      await cargarMecanicos();
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors font-medium"
                  >
                    <CreditCard className="h-4 w-4 mr-2 inline" />
                    Crear Factura Diagnóstico
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Registro de nuevo cliente/vehículo */}
        {paso === 3 && (
          <div className="space-y-6">
            {/* Registro de cliente */}
            {!datos.cliente && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Registrar Nuevo Cliente</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.nombre}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre completo del cliente"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono/NIT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Teléfono o NIT"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={nuevoCliente.email}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                    <input
                      type="text"
                      value={nuevoCliente.direccion}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, direccion: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dirección del cliente"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Registro de vehículo */}
            {!datos.vehiculo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Registrar Nuevo Vehículo</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nuevoVehiculo.marca}
                      onChange={(e) => setNuevoVehiculo(prev => ({ ...prev, marca: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Toyota, Honda, Ford"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nuevoVehiculo.modelo}
                      onChange={(e) => setNuevoVehiculo(prev => ({ ...prev, modelo: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Corolla, Civic, Focus"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nuevoVehiculo.placa}
                      onChange={(e) => setNuevoVehiculo(prev => ({ ...prev, placa: e.target.value.toUpperCase() }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: P123ABC"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                    <input
                      type="number"
                      value={nuevoVehiculo.año}
                      onChange={(e) => setNuevoVehiculo(prev => ({ ...prev, año: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1980"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notas adicionales</label>
                    <textarea
                      value={nuevoVehiculo.notas}
                      onChange={(e) => setNuevoVehiculo(prev => ({ ...prev, notas: e.target.value }))}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Color, características especiales, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-between">
              <button
                onClick={() => setPaso(2)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Volver
              </button>
              
              <button
                onClick={handleRegistrarClienteVehiculo}
                disabled={loading || !validarFormularioRegistro()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors font-medium disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar y Continuar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Paso 4: Facturación */}
        {paso === 4 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Crear Factura de Diagnóstico</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{datos.cliente?.nombre}</p>
                    <p className="text-sm text-gray-600">{datos.cliente?.telefono}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehículo</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{datos.vehiculo?.marca} {datos.vehiculo?.modelo}</p>
                    <p className="text-sm text-gray-600">Placa: {datos.vehiculo?.placa}</p>
                  </div>
                </div>

                {/* Selector de Mecánico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mecánico Asignado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={datos.mecanicoSeleccionado}
                    onChange={(e) => setDatos(prev => ({ ...prev, mecanicoSeleccionado: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar mecánico...</option>
                    {mecanicos.map(mecanico => (
                      <option key={mecanico.id} value={mecanico.id}>
                        {mecanico.nombre} ({mecanico.usuario})
                      </option>
                    ))}
                  </select>
                  {mecanicos.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No hay mecánicos disponibles. Verifique que existan mecánicos registrados.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto del Diagnóstico</label>
                  <input
                    type="number"
                    value={datos.montoDiagnostico}
                    onChange={(e) => setDatos(prev => ({ ...prev, montoDiagnostico: parseFloat(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Total a Cobrar:</span>
                    <span className="text-xl font-bold text-blue-900">Q{datos.montoDiagnostico.toFixed(2)}</span>
                  </div>
                </div>

                {/* Información del mecánico seleccionado */}
                {datos.mecanicoSeleccionado && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Mecánico Asignado:</h4>
                    {(() => {
                      const mecanicoSeleccionado = mecanicos.find(m => m.id.toString() === datos.mecanicoSeleccionado);
                      return mecanicoSeleccionado ? (
                        <div className="text-sm text-green-800">
                          <p><strong>Nombre:</strong> {mecanicoSeleccionado.nombre}</p>
                          <p><strong>Usuario:</strong> {mecanicoSeleccionado.usuario}</p>
                          <p><strong>Tipo:</strong> {mecanicoSeleccionado.tipo}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setPaso(datos.requiereRegistro ? 3 : 2)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Volver
              </button>
              
              <button
                onClick={handleCrearFactura}
                disabled={loading || !datos.mecanicoSeleccionado}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors font-medium disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando Factura...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Crear Factura
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuloDiagnostico;