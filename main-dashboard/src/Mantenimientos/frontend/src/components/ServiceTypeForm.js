import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const ServiceTypeForm = ({ serviceType, onSave, onClose, isLoading }) => {
  const [formData, setFormData] = useState({
    id_inventory: '',
    name: '',
    description: '',
    notes: '',
    price: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (serviceType) {
      setFormData({
        id_inventory: serviceType.id_inventory || '',
        name: serviceType.name || '',
        description: serviceType.description || '',
        notes: serviceType.notes || '',
        price: serviceType.price || ''
      });
    }
  }, [serviceType]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.id_inventory && isNaN(formData.id_inventory)) {
      newErrors.id_inventory = 'El ID de inventario debe ser un número';
    }

    if (formData.price && isNaN(formData.price)) {
      newErrors.price = 'El precio debe ser un número válido';
    }

    if (formData.price && parseFloat(formData.price) < 0) {
      newErrors.price = 'El precio no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Preparar datos para envío
      const dataToSend = {
        ...formData,
        id_inventory: formData.id_inventory ? parseInt(formData.id_inventory) : null,
        price: formData.price ? parseFloat(formData.price) : null
      };
      onSave(dataToSend);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {serviceType ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nombre *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Ingrese el nombre del servicio"
            />
            {errors.name && (
              <div className="error">{errors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="id_inventory" className="form-label">
              ID Inventario
            </label>
            <input
              type="number"
              id="id_inventory"
              name="id_inventory"
              value={formData.id_inventory}
              onChange={handleChange}
              className={`form-input ${errors.id_inventory ? 'error' : ''}`}
              placeholder="Ingrese el ID de inventario (opcional)"
            />
            {errors.id_inventory && (
              <div className="error">{errors.id_inventory}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              placeholder="Ingrese la descripción del servicio"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              placeholder="Ingrese notas adicionales"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Precio
            </label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={`form-input ${errors.price ? 'error' : ''}`}
              placeholder="Ingrese el precio del servicio"
            />
            {errors.price && (
              <div className="error">{errors.price}</div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              <Save size={16} />
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceTypeForm;