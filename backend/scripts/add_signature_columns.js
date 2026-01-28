const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Conectado a la base de datos...');

        // Agregar columna signature_approval
        try {
            await connection.query('ALTER TABLE repairs ADD COLUMN signature_approval LONGTEXT DEFAULT NULL');
            console.log('✅ Columna signature_approval agregada.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ Columna signature_approval ya existe.');
            else console.error('Error approval:', e.message);
        }

        // Agregar columna signature_delivery
        try {
            await connection.query('ALTER TABLE repairs ADD COLUMN signature_delivery LONGTEXT DEFAULT NULL');
            console.log('✅ Columna signature_delivery agregada.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ Columna signature_delivery ya existe.');
            else console.error('Error delivery:', e.message);
        }

        console.log('Migración completada.');
    } catch (err) {
        console.error('Error general:', err);
    } finally {
        await connection.end();
    }
}

migrate();
