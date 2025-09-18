import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ServicesList from '../components/ServicesList.jsx';

const CaseDetailPage = () => {
    const { caseId } = useParams();
    const [caseData, setCaseData] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [caseResponse, servicesResponse] = await Promise.all([
                    fetch(`http://localhost:3000/api/cases/${caseId}`),
                    fetch(`http://localhost:3000/api/cases/${caseId}/services`)
                ]);

                if (!caseResponse.ok) throw new Error('El caso no existe');
                
                const caseData = await caseResponse.json();
                const servicesData = await servicesResponse.json();

                setCaseData(caseData);
                setServices(servicesData);
            } catch (error) {
                console.error("Error al obtener datos del caso:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [caseId]);

    if (loading) {
        return <p className="container">Cargando...</p>;
    }

    if (!caseData) {
        return <p className="container">No se pudo encontrar el caso.</p>;
    }

    return (
        <div className="container">
            <h1>Detalle del Caso #{caseData.idcases}</h1>
            <div className="case-details">
                <p><strong>Cliente:</strong> {caseData.clientName}</p>
                <p><strong>Vehículo (Placa):</strong> {caseData.plate}</p>
                <p><strong>Descripción inicial:</strong> {caseData.description}</p>
                <p><strong>Agente que recibió:</strong> {caseData.agentName}</p>
            </div>
            <hr />
            <h2>Servicios del Caso</h2>
            
            <ServicesList services={services} />
            
        </div>
    );
};

export default CaseDetailPage;