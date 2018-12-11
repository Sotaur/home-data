// Update with your config settings.
module.exports = {

    development: {
        client: 'mysql',
        connection: {
            host: '127.0.0.1',
            user: 'root',
            password: process.env.DB_PASSWORD,
            database: 'home_data_test',
            charset: 'utf8'
        }
    },

    production: {
        client: 'mysql',
        connection: {
            database: 'home_data',
            unixSocket: 'var/lib/mysql/mysql.sock',
            user: 'pi'
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    }

};