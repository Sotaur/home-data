require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

// Knex Setup
const env = process.env.NODE_ENV || 'development';
const config = require('../knexfile')[env];
const db = require('knex')(config);

const deviceTable = 'devices';
const eventTable = 'events';
const ruuviTable = 'ruuvi-data';

app.get('/ruuvi-data', async(req, res) => {
    // These are optional selectors
    const columns = req.body.columns;
    const matches = req.body.matches;
    try {
        const data = await db(ruuviTable).select(columns).from(deviceTable).where(matches);
        res.send(data);
    } catch (error) {
        res.sendStatus(500).json(error);
    }
})

app.post('/ruuvi-data', async(req, res) => {
    const data = req.body;
    const time = data.time;
    const deviceId = data.deviceId;
    const eventId = data.eventId;
    const tagData = data.tags;
    let deviceNum;

    try {
        const device = await db(deviceTable).select().from(deviceTable).where('deviceId', deviceId);
        if (!device.length) {
            const deviceInfo = await db(deviceTable).insert({
                deviceId,
                deviceName: ''
            });
            deviceNum = deviceInfo[0];
        } else {
            deviceNum = device[0].id;
        }

        const event = await db(eventTable).insert({
            uuid: eventId,
            time
        });
        const eventNum = event[0];

        for (const tag of tagData) {
            let tagDevice = await db(deviceTable).select().from(deviceTable).where('deviceId', tag.id);
            if (!tagDevice.length) {
                tagDevice = await db(deviceTable).insert({
                    deviceId: tag.id,
                    deviceName: tag.name
                });
            } else {
                db(device).where('id', tagDevice.id).update({ deviceName: tag.name });
            }

            deviceNum = tagDevice[0].id;

            await db(ruuviTable).insert({
                seen_at: tag.updateAt,
                deviceId: deviceNum,
                eventId: eventNum,
                rssi: tag.rssi,
                temperature: tag.temperature,
                humidity: tag.humidity,
                pressure: tag.pressure,
                accelX: tag.accelX,
                accelY: tag.accelY,
                accelZ: tag.accelZ,
                voltage: tag.voltage,
                txPower: tag.txPower,
                movementCounter: tag.movementCounter,
                measurementSequenceNumber: tag.measurementSequenceNumber
            });
        }

        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500).json(error);
    }
});


app.listen(port);