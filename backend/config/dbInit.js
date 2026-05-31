const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function dbInit() {
    const dbName = process.env.DB_NAME || 'systeck_db';
    
    // Configuración para conectarse al servidor MySQL (sin base de datos específica)
    const configWithoutDb = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    let connection;
    try {
        console.log(`[DB-INIT] Conectando a MySQL en ${configWithoutDb.host}:${configWithoutDb.port}...`);
        connection = await mysql.createConnection(configWithoutDb);

        // 1. Crear base de datos si no existe
        console.log(`[DB-INIT] Verificando existencia de la base de datos "${dbName}"...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        
        // 2. Usar la base de datos seleccionada
        await connection.query(`USE \`${dbName}\``);

        // 3. Comprobar si la tabla 'users' ya existe en la base de datos
        const [tables] = await connection.query(`SHOW TABLES LIKE 'users'`);
        if (tables.length > 0) {
            console.log(`[DB-INIT] La base de datos "${dbName}" ya está inicializada (tabla "users" existente).`);
            return;
        }

        console.log(`[DB-INIT] Inicializando la base de datos por primera vez...`);

        // 4. Leer y ejecutar schema.sql
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
            console.log(`[DB-INIT] Leyendo ${path.basename(schemaPath)}...`);
            let schemaSql = fs.readFileSync(schemaPath, 'utf8');
            
            // Reemplazar nombres de bases de datos por el configurado en .env
            schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS\s+\w+/gi, `CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
            schemaSql = schemaSql.replace(/USE\s+\w+/gi, `USE \`${dbName}\``);

            console.log(`[DB-INIT] Ejecutando comandos de schema.sql...`);
            await connection.query(schemaSql);
            console.log(`[DB-INIT] Esquema base creado exitosamente.`);
        } else {
            console.warn(`[DB-INIT] ADVERTENCIA: No se encontró el archivo ${schemaPath}`);
        }

        // 5. Leer y ejecutar pos_migration.sql
        const posMigrationPath = path.join(__dirname, '../../database/pos_migration.sql');
        if (fs.existsSync(posMigrationPath)) {
            console.log(`[DB-INIT] Leyendo ${path.basename(posMigrationPath)}...`);
            let posMigrationSql = fs.readFileSync(posMigrationPath, 'utf8');
            
            posMigrationSql = posMigrationSql.replace(/USE\s+\w+/gi, `USE \`${dbName}\``);

            console.log(`[DB-INIT] Ejecutando comandos de pos_migration.sql...`);
            await connection.query(posMigrationSql);
            console.log(`[DB-INIT] Migración POS e inventario aplicada exitosamente.`);
        } else {
            console.warn(`[DB-INIT] ADVERTENCIA: No se encontró el archivo ${posMigrationPath}`);
        }

        // 6. Crear tabla activity_logs si no existe
        console.log(`[DB-INIT] Verificando existencia de la tabla "activity_logs"...`);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                user_email VARCHAR(255),
                action VARCHAR(255) NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log(`[DB-INIT] Tabla activity_logs verificada/creada.`);

        console.log(`[DB-INIT] ✅ Base de datos "${dbName}" inicializada correctamente.`);

    } catch (error) {
        console.error(`[DB-INIT] ❌ Error en la inicialización de la base de datos:`, error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

module.exports = dbInit;
