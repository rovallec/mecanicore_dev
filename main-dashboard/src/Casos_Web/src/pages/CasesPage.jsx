import React, { useState, useEffect } from 'react';
import CasesList from '../components/CasesList.jsx'; 
const CasesPage = () => {

    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        
        const fetchCases = async () => {
            try {
                
                const response = await fetch('http://localhost:3000/api/cases');
                const data = await response.json();
                setCases(data); 
            } catch (error) {
                console.error("Error al obtener los casos:", error);
            } finally {
                setLoading(false); 
            }
        };

        fetchCases(); 
    }, []); 

    if (loading) {
        return <p>Cargando casos...</p>;
    }

    return (
        <div className="container">
            <h1>Módulo: Casos</h1>
            <p>Gestiona los casos del taller</p>
            
            
            <CasesList cases={cases} />
        </div>
    );
};

export default CasesPage;