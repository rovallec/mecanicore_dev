const { getPool, sql } = require('../config/database');

// Obtener todos los tipos de servicios
const getAllServiceTypes = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT idserviceTypes, id_inventory, name, description, notes, price
      FROM serviceTypes 
      WHERE idserviceTypes IS NOT NULL
      ORDER BY idserviceTypes
    `);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error obteniendo tipos de servicios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Obtener tipo de servicio por ID
const getServiceTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM serviceTypes WHERE idserviceTypes = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tipo de servicio no encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error obteniendo tipo de servicio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Crear nuevo tipo de servicio
const createServiceType = async (req, res) => {
  try {
    const { id_inventory, name, description, notes, price } = req.body;
    const pool = getPool();
    
    const result = await pool.request()
      .input('id_inventory', sql.Int, id_inventory || null)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('notes', sql.NVarChar, notes || null)
      .input('price', sql.Decimal(10, 2), price || null)
      .query(`
        INSERT INTO serviceTypes (id_inventory, name, description, notes, price) 
        OUTPUT INSERTED.idserviceTypes
        VALUES (@id_inventory, @name, @description, @notes, @price)
      `);
    
    res.status(201).json({
      success: true,
      message: 'Tipo de servicio creado exitosamente',
      data: { id: result.recordset[0].idserviceTypes }
    });
  } catch (error) {
    console.error('Error creando tipo de servicio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Actualizar tipo de servicio
const updateServiceType = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_inventory, name, description, notes, price } = req.body;
    const pool = getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('id_inventory', sql.Int, id_inventory || null)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('notes', sql.NVarChar, notes || null)
      .input('price', sql.Decimal(10, 2), price || null)
      .query(`
        UPDATE serviceTypes 
        SET id_inventory = @id_inventory, 
            name = @name, 
            description = @description, 
            notes = @notes, 
            price = @price
        WHERE idserviceTypes = @id
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tipo de servicio no encontrado' 
      });
    }
    
    res.json({
      success: true,
      message: 'Tipo de servicio actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando tipo de servicio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Eliminar tipo de servicio
const deleteServiceType = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM serviceTypes WHERE idserviceTypes = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tipo de servicio no encontrado' 
      });
    }
    
    res.json({
      success: true,
      message: 'Tipo de servicio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando tipo de servicio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Buscar tipos de servicios
const searchServiceTypes = async (req, res) => {
  try {
    const { q } = req.query;
    const pool = getPool();
    
    const result = await pool.request()
      .input('search', sql.NVarChar, `%${q}%`)
      .query(`
        SELECT idserviceTypes, id_inventory, name, description, notes, price
        FROM serviceTypes 
        WHERE (name LIKE @search 
           OR description LIKE @search 
           OR notes LIKE @search
           OR CAST(idserviceTypes AS NVARCHAR) LIKE @search
           OR CAST(id_inventory AS NVARCHAR) LIKE @search)
           AND idserviceTypes IS NOT NULL
        ORDER BY idserviceTypes
      `);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error buscando tipos de servicios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

module.exports = {
  getAllServiceTypes,
  getServiceTypeById,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  searchServiceTypes
};