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

const moment = require('moment');

const deviceTable = 'devices';
const ruuviTable = 'ruuvi-data';

app.get('/ruuvi-data', async(req, res, next) => {
    // These are optional selectors
    const columns = req.body.columns;
    const matches = req.body.matches;
    try {
        const data = await db(ruuviTable).select(columns).from(deviceTable).where(matches);
        res.send(data);
    } catch (error) {
        next(error);
    }
});

app.post('/ruuvi-data', async(req, res, next) => {
    const body = req.body;
    const time = body.time;
    const data = body.data;
    const deviceId = data.mac;
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

        await db(ruuviTable).insert({
            seen_at: moment(time).format('YYYY-MM-DD HH:mm:SS'),
            deviceId: deviceNum,
            rssi: body.rssi,
            temperature: data.temperature,
            humidity: data.humidity,
            pressure: data.pressure,
            accelX: data.accelerationX,
            accelY: data.accelerationY,
            accelZ: data.accelerationZ,
            voltage: data.battery,
        });

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res) => {
    console.error(error);
    res.send(error.message);
});

app.listen(port);