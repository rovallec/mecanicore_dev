
const { sql } = require('../db/connection'); 

const casesController = {};

casesController.getAllCases = async (req, res) => {
    try {
        
        const pool = await sql.connect();
     
        const result = await pool.request().query(`
    SELECT 
        c.idcases,
        c.description,
        v.plate,
        cl.fullname as clientName,
        u.displayname as agentName
    FROM cases c
    JOIN vehicles v ON c.id_vehicle = v.idvehicles
    JOIN clients cl ON v.id_client = cl.idclients
    JOIN users u ON c.id_agent = u.iduser
    ORDER BY c.idcases DESC
`);

        res.json(result.recordset);

    } catch (error) {
        
        console.error('Error al obtener los casos:', error);
        res.status(500).send('Error al obtener los datos de los casos');
    }
};

casesController.getCaseById = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await sql.connect();
        const result = await pool.request()

            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    c.idcases,
                    c.description,
                    v.plate,
                    cl.fullname as clientName,
                    u.displayname as agentName
                FROM cases c
                JOIN vehicles v ON c.id_vehicle = v.idvehicles
                JOIN clients cl ON v.id_client = cl.idclients
                JOIN users u ON c.id_agent = u.iduser
                WHERE c.idcases = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Caso no encontrado' });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error('Error al obtener el caso:', error);
        res.status(500).send('Error al obtener los datos del caso');
    }
};

casesController.getServicesByCaseId = async (req, res) => {
    try {
        const { caseId } = req.params;

        const pool = await sql.connect();
        const result = await pool.request()
            .input('caseId', sql.Int, caseId)
            .query(`
                SELECT 
                    s.idservices,
                    st.name as serviceName, 
                    st.description,
                    st.price,
                    s.status
                FROM services s
                JOIN serviceTypes st ON s.id_serviceType = st.idserviceTypes
                WHERE s.id_case = @caseId
                ORDER BY s.idservices ASC
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error('Error al obtener los servicios del caso:', error);
        res.status(500).send('Error al obtener los servicios del caso');
    }
};


module.exports = casesController;