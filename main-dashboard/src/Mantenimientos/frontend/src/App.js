import React, { useState, useEffect } from 'react';
import { Plus, User, Settings } from 'lucide-react';
import './App.css';
import ServiceTypeList from './components/ServiceTypeList';
import ServiceTypeForm from './components/ServiceTypeForm';
import SearchBar from './components/SearchBar';
import serviceTypeService from './services/serviceTypeService';

function App() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  // Cargar tipos de servicios al montar el componente
  useEffect(() => {
    loadServiceTypes();
  }, []);

  const loadServiceTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await serviceTypeService.getAllServiceTypes();
      setServiceTypes(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      setLoading(true);
      setError(null);
      const response = await serviceTypeService.searchServiceTypes(query);
      setServiceTypes(response.data || []);
      setSearchActive(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchActive(false);
    loadServiceTypes();
  };

  const handleCreateServiceType = () => {
    setEditingServiceType(null);
    setShowForm(true);
  };

  const handleEditServiceType = (serviceType) => {
    setEditingServiceType(serviceType);
    setShowForm(true);
  };

  const handleSaveServiceType = async (serviceTypeData) => {
    try {
      setFormLoading(true);
      
      if (editingServiceType) {
        // Actualizar tipo de servicio existente
        await serviceTypeService.updateServiceType(editingServiceType.idserviceTypes, serviceTypeData);
      } else {
        // Crear nuevo tipo de servicio
        await serviceTypeService.createServiceType(serviceTypeData);
      }
      
      // Cerrar formulario y recargar lista
      setShowForm(false);
      setEditingServiceType(null);
      
      // Recargar la lista apropiada
      if (searchActive) {
        // Si hay una búsqueda activa, mantener los resultados
        await loadServiceTypes();
        setSearchActive(false);
      } else {
        await loadServiceTypes();
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteServiceType = async (serviceTypeId, serviceTypeName) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el tipo de servicio "${serviceTypeName}"?`)) {
      try {
        setLoading(true);
        await serviceTypeService.deleteServiceType(serviceTypeId);
        
        // Recargar la lista
        if (searchActive) {
          await loadServiceTypes();
          setSearchActive(false);
        } else {
          await loadServiceTypes();
        }
        
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingServiceType(null);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>Panel Taller — Administración</h1>
          <div className="user-info">
            <User size={16} />
            Usuario: juan.perez
            <span>Agente</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Module Header */}
        <div className="module-header">
          <h2 className="module-title">
            <Settings size={24} style={{ marginRight: '0.5rem' }} />
            Módulo: Tipos de Servicios
          </h2>
          <p className="module-subtitle">Gestiona los tipos de servicios del taller</p>
        </div>

        {/* Search and Actions */}
        <div className="search-actions">
          <SearchBar 
            onSearch={handleSearch}
            onClear={handleClearSearch}
          />
          <button 
            onClick={handleCreateServiceType}
            className="btn btn-success"
          >
            <Plus size={16} />
            Nuevo Tipo de Servicio
          </button>
        </div>

        {/* Results Info */}
        {!loading && (
          <div className="results-info">
            {searchActive 
              ? `Resultados de búsqueda: ${serviceTypes.length}`
              : `Resultados: ${serviceTypes.length}`
            }
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* Service Type List */}
        <ServiceTypeList
          serviceTypes={serviceTypes}
          onEdit={handleEditServiceType}
          onDelete={handleDeleteServiceType}
          loading={loading}
          error={null} // El error se muestra arriba
        />

        {/* Service Type Form Modal */}
        {showForm && (
          <ServiceTypeForm
            serviceType={editingServiceType}
            onSave={handleSaveServiceType}
            onClose={handleCloseForm}
            isLoading={formLoading}
          />
        )}
      </main>
    </div>
  );
}

export default App;