exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('devices', function(table) {
            table.increments('id').primary();
            table.string('deviceId');
            table.string('deviceName');
        }),
        knex.schema.createTable('events', function(table) {
            table.increments('id').primary();
            table.string('uuid');
            table.dateTime('time');
        }),
        knex.schema.createTable('ruuvi-data', function(table) {
            table.increments('id').primary();
            table.dateTime('seen_at');
            table.foreign('deviceId').references('id').inTable('devices');
            table.foreign('eventId').references('id').inTable('events');
            table.integer('rssi');
            table.float('temperature');
            table.float('humidity');
            table.float('pressure');
            table.float('accelX');
            table.float('accelY');
            table.float('accelZ');
            table.float('voltage');
            table.float('txPower');
            table.integer('movementCounter');
            table.integer('measurementSequenceNumber');
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('ruuvi-data')
    ])
};