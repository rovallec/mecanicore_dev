const { executeQuery } = require('./config/database');

const verificarTablaUsers = async () => {
  try {
    console.log('VERIFICANDO TABLA USERS');
    console.log('=' .repeat(50));

    // 1. Ver estructura de la tabla users
    console.log('\n1. ESTRUCTURA DE LA TABLA USERS:');
    console.log('-'.repeat(40));
    
    const estructura = await executeQuery(`
      SELECT 
        COLUMN_NAME as columna,
        DATA_TYPE as tipo,
        IS_NULLABLE as permite_null,
        COLUMN_DEFAULT as valor_default,
        CHARACTER_MAXIMUM_LENGTH as longitud_max
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);

    estructura.forEach((col, i) => {
      const nullable = col.permite_null === 'YES' ? 'NULL' : 'NOT NULL';
      const longitud = col.longitud_max ? `(${col.longitud_max})` : '';
      const defaultVal = col.valor_default ? ` DEFAULT: ${col.valor_default}` : '';
      console.log(`${i + 1}. ${col.columna} - ${col.tipo}${longitud} ${nullable}${defaultVal}`);
    });

    // 2. Contar total de usuarios
    console.log('\n2. TOTAL DE USUARIOS:');
    console.log('-'.repeat(40));
    
    const conteoTotal = await executeQuery('SELECT COUNT(*) as total FROM users');
    console.log(`Total de usuarios en la tabla: ${conteoTotal[0].total}`);

    // 3. Mostrar todos los usuarios
    console.log('\n3. TODOS LOS USUARIOS:');
    console.log('-'.repeat(40));
    
    const todosUsuarios = await executeQuery(`
      SELECT * FROM users ORDER BY iduser
    `);

    if (todosUsuarios.length === 0) {
      console.log('No hay usuarios en la tabla');
    } else {
      todosUsuarios.forEach((user, index) => {
        console.log(`Usuario ${index + 1}:`);
        console.log(`  ID: ${user.iduser}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Display Name: ${user.displayname}`);
        console.log(`  Password: ${user.password ? '[OCULTO]' : 'NULL'}`);
        console.log(`  Type: ${user.type}`);
        console.log('  ---');
      });
    }

    // 4. Usuarios por tipo
    console.log('\n4. USUARIOS POR TIPO:');
    console.log('-'.repeat(40));
    
    const usuariosPorTipo = await executeQuery(`
      SELECT 
        type as tipo,
        COUNT(*) as cantidad,
        STRING_AGG(CAST(iduser AS VARCHAR), ', ') as ids
      FROM users 
      GROUP BY type
      ORDER BY type
    `);

    usuariosPorTipo.forEach(grupo => {
      console.log(`${grupo.tipo}: ${grupo.cantidad} usuario(s) - IDs: ${grupo.ids}`);
    });

    // 5. Verificar IDs específicos
    console.log('\n5. VERIFICANDO IDs ESPECÍFICOS:');
    console.log('-'.repeat(40));
    
    const idsEspecificos = [1, 2, 3, 4, 5];
    
    for (const id of idsEspecificos) {
      const usuario = await executeQuery(`
        SELECT iduser, username, displayname, type 
        FROM users 
        WHERE iduser = @id
      `, { id });
      
      if (usuario.length > 0) {
        const u = usuario[0];
        console.log(`ID ${id}: ${u.displayname} (${u.username}) - ${u.type}`);
      } else {
        console.log(`ID ${id}: NO EXISTE`);
      }
    }

    // 6. Usuarios válidos para usar como agentes
    console.log('\n6. USUARIOS VÁLIDOS PARA AGENTES:');
    console.log('-'.repeat(40));
    
    const agentesValidos = await executeQuery(`
      SELECT iduser, displayname, username, type 
      FROM users 
      WHERE type IN ('ADMIN', 'RECEPTIONIST')
      ORDER BY iduser
    `);

    if (agentesValidos.length > 0) {
      console.log('Usuarios ADMIN/RECEPTIONIST:');
      agentesValidos.forEach(agent => {
        console.log(`  ${agent.iduser}: ${agent.displayname} (${agent.type})`);
      });
    } else {
      console.log('No hay usuarios ADMIN/RECEPTIONIST');
      console.log('Cualquier usuario puede ser usado como agente:');
      
      const cualquierUsuario = await executeQuery(`
        SELECT TOP 3 iduser, displayname, type 
        FROM users 
        ORDER BY iduser
      `);
      
      cualquierUsuario.forEach(user => {
        console.log(`  ${user.iduser}: ${user.displayname} (${user.type})`);
      });
    }

    // 7. Mecánicos disponibles
    console.log('\n7. MECÁNICOS DISPONIBLES:');
    console.log('-'.repeat(40));
    
    const mecanicos = await executeQuery(`
      SELECT iduser, displayname, username 
      FROM users 
      WHERE type = 'MECHANIC'
      ORDER BY iduser
    `);

    if (mecanicos.length > 0) {
      mecanicos.forEach(mec => {
        console.log(`  ${mec.iduser}: ${mec.displayname} (${mec.username})`);
      });
    } else {
      console.log('No hay usuarios tipo MECHANIC');
    }

    // 8. Verificar foreign key constraints
    console.log('\n8. FOREIGN KEY CONSTRAINTS DE USERS:');
    console.log('-'.repeat(40));
    
    try {
      const fks = await executeQuery(`
        SELECT 
          OBJECT_NAME(f.parent_object_id) AS tabla_referenciante,
          COL_NAME(fc.parent_object_id, fc.parent_column_id) AS columna_referenciante,
          f.name AS nombre_constraint
        FROM sys.foreign_keys AS f
        INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
        WHERE f.referenced_object_id = OBJECT_ID('users')
      `);

      if (fks.length > 0) {
        console.log('Tablas que referencian a users:');
        fks.forEach(fk => {
          console.log(`  ${fk.tabla_referenciante}.${fk.columna_referenciante} (${fk.nombre_constraint})`);
        });
      } else {
        console.log('No hay foreign keys que referencien la tabla users');
      }
    } catch (error) {
      console.log('Error verificando foreign keys:', error.message);
    }

    console.log('\n✅ VERIFICACIÓN COMPLETADA');

  } catch (error) {
    console.error('Error verificando tabla users:', error);
  }
};

const ejecutar = async () => {
  const { connectDB } = require('./config/database');
  
  try {
    console.log('Conectando a la base de datos...');
    await connectDB();
    console.log('Conexión establecida.\n');
    
    await verificarTablaUsers();
    
  } catch (error) {
    console.error('Error ejecutando verificación:', error);
  } finally {
    process.exit(0);
  }
};

if (require.main === module) {
  ejecutar();
}

module.exports = { verificarTablaUsers };