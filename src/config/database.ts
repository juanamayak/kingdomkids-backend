import {Sequelize} from 'sequelize';

/** Exporta la constnte que contiene la conexión a la base de datos */
export const database = new Sequelize({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    dialect: 'mysql',
    logging: false, // Cambia este valor si deseas ver las consultas que estas ejecutando
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 15000
    },
});


export class Database {
    public async connection() {
        try {
            await database.authenticate();
            return {ok: true, message: 'Connection to the database established correctly'}
        } catch (e) {
            return {ok: false, message: 'Could not connect to the database. Please check the following: ' + e}
        }
    }
}

