import React from 'react';

const ServicesList = ({ services }) => {
    if (services.length === 0) {
        return <p>No hay servicios asignados a este caso todavía.</p>;
    }

    return (
        <table className="table">
            <thead>
                <tr>
                    <th>ID Servicio</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                {services.map((service) => (
                    <tr key={service.idservices}>
                        <td>{service.idservices}</td>
                        <td>{service.serviceName}</td>
                        <td>{service.description}</td>
                        <td>Q{service.price}</td> 
                        <td>{service.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ServicesList;