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

        // Modificar columna status para aceptar nuevos valores
        // Lo cambiamos a VARCHAR(50) para evitar problemas futuros con ENUMs limitados
        try {
            console.log('Modificando columna status...');
            await connection.query("ALTER TABLE repairs MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'received'");
            console.log('✅ Columna status modificada a VARCHAR(50).');
        } catch (e) {
            console.error('Error al modificar status:', e.message);
        }

        console.log('Migración completada.');
    } catch (err) {
        console.error('Error general:', err);
    } finally {
        await connection.end();
    }
}

migrate();
