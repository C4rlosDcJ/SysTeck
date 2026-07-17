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
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
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
        if (tables.length === 0) {
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
        } else {
            console.log(`[DB-INIT] La base de datos "${dbName}" ya cuenta con la tabla "users".`);
        }

        // 6. Crear tabla activity_logs si no existe (siempre se verifica)
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

        // 7. Verificar y agregar columnas reset_password_token y reset_password_expires a users si no existen
        console.log(`[DB-INIT] Verificando columnas de restablecimiento en tabla "users"...`);
        const [tokenCol] = await connection.query(`SHOW COLUMNS FROM users LIKE 'reset_password_token'`);
        if (tokenCol.length === 0) {
            await connection.query(`ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255) NULL`);
            console.log(`[DB-INIT] Columna reset_password_token añadida.`);
        }
        const [expiresCol] = await connection.query(`SHOW COLUMNS FROM users LIKE 'reset_password_expires'`);
        if (expiresCol.length === 0) {
            await connection.query(`ALTER TABLE users ADD COLUMN reset_password_expires DATETIME NULL`);
            console.log(`[DB-INIT] Columna reset_password_expires añadida.`);
        }

        // 8. Verificar y agregar columnas rating y review_text a repairs si no existen
        console.log(`[DB-INIT] Verificando columnas de opiniones en tabla "repairs"...`);
        const [ratingCol] = await connection.query(`SHOW COLUMNS FROM repairs LIKE 'rating'`);
        if (ratingCol.length === 0) {
            await connection.query(`ALTER TABLE repairs ADD COLUMN rating INT NULL`);
            console.log(`[DB-INIT] Columna rating añadida a repairs.`);
        }
        const [reviewTextCol] = await connection.query(`SHOW COLUMNS FROM repairs LIKE 'review_text'`);
        if (reviewTextCol.length === 0) {
            await connection.query(`ALTER TABLE repairs ADD COLUMN review_text TEXT NULL`);
        }

        // 8.5. Verificar y agregar columna payment_status a repairs si no existe
        console.log(`[DB-INIT] Verificando columna "payment_status" en tabla "repairs"...`);
        const [paymentStatusCol] = await connection.query(`SHOW COLUMNS FROM repairs LIKE 'payment_status'`);
        if (paymentStatusCol.length === 0) {
            await connection.query(`ALTER TABLE repairs ADD COLUMN payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending' AFTER status`);
            console.log(`[DB-INIT] Columna payment_status añadida a repairs.`);
        }

        // 8.6. Verificar y agregar columna parent_repair_id a repairs si no existe
        console.log(`[DB-INIT] Verificando columna "parent_repair_id" en tabla "repairs"...`);
        const [parentRepairCol] = await connection.query(`SHOW COLUMNS FROM repairs LIKE 'parent_repair_id'`);
        if (parentRepairCol.length === 0) {
            await connection.query(`ALTER TABLE repairs ADD COLUMN parent_repair_id INT NULL, ADD CONSTRAINT fk_parent_repair FOREIGN KEY (parent_repair_id) REFERENCES repairs(id) ON DELETE SET NULL`);
            console.log(`[DB-INIT] Columna parent_repair_id añadida a repairs.`);
        }

        // 8.7. Verificar y agregar columna technical_observations a repairs si no existe
        console.log(`[DB-INIT] Verificando columna "technical_observations" en tabla "repairs"...`);
        const [techObsCol] = await connection.query(`SHOW COLUMNS FROM repairs LIKE 'technical_observations'`);
        if (techObsCol.length === 0) {
            await connection.query(`ALTER TABLE repairs ADD COLUMN technical_observations TEXT NULL`);
            console.log(`[DB-INIT] Columna technical_observations añadida a repairs.`);
        }

        // 8.8. Verificar y agregar columna warranty_approved a repairs si no existe
        console.log(`[DB-INIT] Verificando columna "warranty_approved" en tabla "repairs"...`);
        const [warrantyApprovedCol] = await connection.query(`SHOW COLUMNS FROM repairs LIKE 'warranty_approved'`);
        if (warrantyApprovedCol.length === 0) {
            await connection.query(`ALTER TABLE repairs ADD COLUMN warranty_approved VARCHAR(20) DEFAULT 'pending'`);
            console.log(`[DB-INIT] Columna warranty_approved añadida a repairs.`);
        }

        // 8.9. Verificar y agregar columna warranty_tech_notes a repairs si no existe
        console.log(`[DB-INIT] Verificando columna "warranty_tech_notes" en tabla "repairs"...`);
        const [warrantyTechNotesCol] = await connection.query(`SHOW COLUMNS FROM repairs LIKE 'warranty_tech_notes'`);
        if (warrantyTechNotesCol.length === 0) {
            await connection.query(`ALTER TABLE repairs ADD COLUMN warranty_tech_notes TEXT NULL`);
            console.log(`[DB-INIT] Columna warranty_tech_notes añadida a repairs.`);
        }

        // 9. Modificar tipo de setting_value a LONGTEXT para soportar logos pesados en base64
        console.log(`[DB-INIT] Asegurando que la columna "setting_value" en tabla "settings" soporte datos largos (LONGTEXT)...`);
        await connection.query(`ALTER TABLE settings MODIFY COLUMN setting_value LONGTEXT`);

        // 10. Asegurar que las columnas de la tabla 'sales' tengan la estructura necesaria para pedidos web
        console.log(`[DB-INIT] Verificando y alterando tabla "sales" para soportar pedidos web...`);
        try {
            console.log(`[DB-INIT] Haciendo nullable la columna cashier_id en la tabla sales...`);
            await connection.query('ALTER TABLE sales MODIFY COLUMN cashier_id INT NULL');
            
            console.log(`[DB-INIT] Asegurando que la columna status en sales acepte el estado "pending"...`);
            await connection.query("ALTER TABLE sales MODIFY COLUMN status ENUM('completed', 'cancelled', 'refunded', 'pending') DEFAULT 'completed'");
            console.log(`[DB-INIT] Modificaciones de tabla sales aplicadas correctamente.`);
        } catch (e) {
            console.error(`[DB-INIT] Error al alterar la tabla sales:`, e.message);
        }

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
