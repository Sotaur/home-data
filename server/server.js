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

app.post('/ruuvi-data', async(req, res) => {
    const data = req.body;
    const time = data.time;
    const deviceId = data.deviceId;
    const eventId = data.eventId;
    const tagData = data.tags;
    let deviceNum;

    try {
        const device = await db(deviceTable).select().from('devices').where('deviceId', deviceId);
        if (!device) {
            const deviceInfo = await db(deviceTable).insert({
                deviceId,
                deviceName: ''
            });
            deviceNum = deviceInfo.id;
        } else {
            deviceNum = device.id;
        }

        const event = await db(eventTable).insert({
            uuid: eventId,
            time
        });
        const eventNum = event.id;

        for (const tag of tagData) {
            let tagDevice = await db(deviceTable).select().from('devices').where('deviceId', tag.id);
            if (!tagDevice) {
                tagDevice = await db(deviceTable).insert({
                    deviceId: tag.id,
                    deviceName: tag.name
                });
            } else {
                db(device).where('id', tagDevice.id).update({ deviceName: tag.name });
            }

            deviceNum = tagDevice.id;

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

        console.log(`Added ${tagData.length} data points`);

        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500).json(error);
    }
});


app.listen(port);