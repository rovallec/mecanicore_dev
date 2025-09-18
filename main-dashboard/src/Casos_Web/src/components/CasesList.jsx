import React from 'react';

import { Link } from 'react-router-dom';
const CasesList = ({ cases }) => {
    return (
        <table className="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>CLIENTE</th>
                    <th>PLACA</th>
                    <th>DESCRIPCIÓN</th>
                    <th>AGENTE</th>
                    <th>ACCIONES</th>
                </tr>
            </thead>
            <tbody>
                {cases.map((caseItem) => (
                    <tr key={caseItem.idcases}>
                        <td>{caseItem.idcases}</td>
                        <td>{caseItem.clientName}</td>
                        <td>{caseItem.plate}</td>
                        <td>{caseItem.description}</td>
                        <td>{caseItem.agentName}</td>
                        <td>
                            <Link to={`/case/${caseItem.idcases}`} className="btn-edit">✏️</Link>
                            <button className="btn-delete">🗑️</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default CasesList;