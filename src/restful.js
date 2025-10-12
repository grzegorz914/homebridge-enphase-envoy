import express, { json } from 'express';
import EventEmitter from 'events';

const DEFAULT_MESSAGE = 'This data is not available in your system.';

class RestFul extends EventEmitter {
    constructor(config) {
        super();
        this.port = config.port;
        this.logWarn = config.logWarn;
        this.logDebug = config.logDebug;

        this.restFulData = {
            token: DEFAULT_MESSAGE,
            info: DEFAULT_MESSAGE,
            home: DEFAULT_MESSAGE,
            inventory: DEFAULT_MESSAGE,
            microinvertersstatus: DEFAULT_MESSAGE,
            meters: DEFAULT_MESSAGE,
            metersreading: DEFAULT_MESSAGE,
            metersreports: DEFAULT_MESSAGE,
            detaileddevicesdata: DEFAULT_MESSAGE,
            microinvertersdata: DEFAULT_MESSAGE,
            qrelaysdata: DEFAULT_MESSAGE,
            homedata: DEFAULT_MESSAGE,
            metersdata: DEFAULT_MESSAGE,
            production: DEFAULT_MESSAGE,
            productionpdm: DEFAULT_MESSAGE,
            energypdm: DEFAULT_MESSAGE,
            productionct: DEFAULT_MESSAGE,
            powerandenergydata: DEFAULT_MESSAGE,
            acbatterydata: DEFAULT_MESSAGE,
            ensembleinventory: DEFAULT_MESSAGE,
            ensemblestatus: DEFAULT_MESSAGE,
            ensemblepower: DEFAULT_MESSAGE,
            enchargesettings: DEFAULT_MESSAGE,
            tariff: DEFAULT_MESSAGE,
            drycontacts: DEFAULT_MESSAGE,
            drycontactssettings: DEFAULT_MESSAGE,
            generator: DEFAULT_MESSAGE,
            generatorsettings: DEFAULT_MESSAGE,
            ensembledata: DEFAULT_MESSAGE,
            gridprofile: DEFAULT_MESSAGE,
            livedata: DEFAULT_MESSAGE,
            livedatadata: DEFAULT_MESSAGE,
            productionstate: DEFAULT_MESSAGE,
            plclevel: DEFAULT_MESSAGE,
            datasampling: DEFAULT_MESSAGE
        };

        this.connect();
    }

    connect() {
        try {
            const app = express();
            app.set('json spaces', 2);
            app.use(json());

            // Create GET routes directly from field names
            for (const key of Object.keys(this.restFulData)) {
                app.get(`/${key}`, (req, res) => {
                    res.json(this.restFulData[key]);
                });
            }

            // Health check route
            app.get('/status', (req, res) => {
                res.json({
                    status: 'online',
                    uptime: process.uptime(),
                    available_paths: Object.keys(this.restFulData).map(k => `/${k}`)
                });
            });

            // POST route
            app.post('/', (req, res) => {
                try {
                    const obj = req.body;
                    if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
                        if (this.logWarn) this.emit('warn', 'RESTFul Invalid JSON payload');
                        return res.status(400).json({ error: 'RESTFul Invalid JSON payload' });
                    }

                    const key = Object.keys(obj)[0];
                    const value = obj[key];
                    this.emit('set', key, value);
                    this.update(key, value);

                    if (this.logDebug) this.emit('debug', `RESTFul post data: ${JSON.stringify(obj, null, 2)}`);

                    res.json({ success: true, received: obj });
                } catch (error) {
                    if (this.logWarn) this.emit('warn', `RESTFul Parse error: ${error}`);
                    res.status(500).json({ error: 'RESTFul Internal Server Error' });
                }
            });

            app.listen(this.port, () => {
                this.emit('connected', `RESTful started on port: ${this.port}`);
            });
        } catch (error) {
            if (this.logWarn) this.emit('warn', `RESTful Connect error: ${error}`);
        }
    }

    update(path, data) {
        if (this.restFulData.hasOwnProperty(path)) {
            this.restFulData[path] = data;
            if (this.logDebug) this.emit('debug', `RESTFul update path: ${path}, data: ${JSON.stringify(data, null, 2)}`);
        } else {
            if (this.logWarn) this.emit('warn', `RESTFul update failed. Unknown path: "${path}". Valid paths: ${Object.keys(this.restFulData).join(', ')}`);
        }
    }
}

export default RestFul;

