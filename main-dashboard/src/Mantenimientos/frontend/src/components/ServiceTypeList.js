import React from 'react';
import { Edit, Trash2, Loader } from 'lucide-react';

const ServiceTypeList = ({ 
  serviceTypes, 
  onEdit, 
  onDelete, 
  loading, 
  error 
}) => {
  if (loading) {
    return (
      <div className="loading">
        <Loader className="loading-spinner" size={20} />
        Cargando tipos de servicios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  if (!serviceTypes || serviceTypes.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <h3>No hay tipos de servicios registrados</h3>
          <p>Comience agregando un nuevo tipo de servicio usando el botón "Nuevo Tipo de Servicio"</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    if (!price) return '-';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>ID Servicio</th>
            <th>ID Inventario</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Notas</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {serviceTypes.map((serviceType) => (
            <tr key={serviceType.idserviceTypes}>
              <td>{serviceType.idserviceTypes}</td>
              <td>{serviceType.id_inventory || '-'}</td>
              <td>
                <strong>{serviceType.name}</strong>
              </td>
              <td>
                <span title={serviceType.description}>
                  {truncateText(serviceType.description)}
                </span>
              </td>
              <td>
                <span title={serviceType.notes}>
                  {truncateText(serviceType.notes)}
                </span>
              </td>
              <td>
                <strong>{formatPrice(serviceType.price)}</strong>
              </td>
              <td>
                <div className="table-actions">
                  <button
                    onClick={() => onEdit(serviceType)}
                    className="btn btn-secondary"
                    title="Editar tipo de servicio"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(serviceType.idserviceTypes, serviceType.name)}
                    className="btn btn-danger"
                    title="Eliminar tipo de servicio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServiceTypeList;