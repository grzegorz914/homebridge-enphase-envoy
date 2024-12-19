import express, { json } from 'express';
import EventEmitter from 'events';

class RestFul extends EventEmitter {
    constructor(config) {
        super();
        this.restFulPort = config.port;
        this.restFulDebug = config.debug;

        this.restFulData = {
            token: 'This data is not available in your system.',
            info: 'This data is not available in your system.',
            home: 'This data is not available in your system.',
            inventory: 'This data is not available in your system.',
            meters: 'This data is not available in your system.',
            metersReading: 'This data is not available in your system.',
            ensembleInventory: 'This data is not available in your system.',
            ensembleStatus: 'This data is not available in your system.',
            enchargesettings: 'This data is not available in your system.',
            tariff: 'This data is not available in your system.',
            drycontacts: 'This data is not available in your system.',
            drycontactssettings: 'This data is not available in your system.',
            generator: 'This data is not available in your system.',
            generatorsettings: 'This data is not available in your system.',
            gridProfile: 'This data is not available in your system.',
            liveData: 'This data is not available in your system.',
            production: 'This data is not available in your system.',
            productionCt: 'This data is not available in your system.',
            microinverters: 'This data is not available in your system.',
            powerMode: 'This data is not available in your system.',
            plcLevel: 'This data is not available in your system.',
            dataSampling: 'This data is not available in your system.'
        };

        this.connect();
    };

    connect() {
        try {
            const restFul = express();
            restFul.set('json spaces', 2);
            restFul.use(json());
            restFul.get('/token', (req, res) => { res.json(this.restFulData.token) });
            restFul.get('/info', (req, res) => { res.json(this.restFulData.info) });
            restFul.get('/home', (req, res) => { res.json(this.restFulData.home) });
            restFul.get('/inventory', (req, res) => { res.json(this.restFulData.inventory) });
            restFul.get('/meters', (req, res) => { res.json(this.restFulData.meters) });
            restFul.get('/metersreading', (req, res) => { res.json(this.restFulData.metersReading) });
            restFul.get('/ensembleinventory', (req, res) => { res.json(this.restFulData.ensembleInventory) });
            restFul.get('/ensemblestatus', (req, res) => { res.json(this.restFulData.ensembleStatus) });
            restFul.get('/enchargesettings', (req, res) => { res.json(this.restFulData.enchargesettings) });
            restFul.get('/tariff', (req, res) => { res.json(this.restFulData.tariff) });
            restFul.get('/drycontacts', (req, res) => { res.json(this.restFulData.drycontacts) });
            restFul.get('/drycontactssettings', (req, res) => { res.json(this.restFulData.drycontactssettings) });
            restFul.get('/generator', (req, res) => { res.json(this.restFulData.generator) });
            restFul.get('/generatorsettings', (req, res) => { res.json(this.restFulData.generatorsettings) });
            restFul.get('/gridprofile', (req, res) => { res.json(this.restFulData.gridProfile) });
            restFul.get('/livedata', (req, res) => { res.json(this.restFulData.liveData) });
            restFul.get('/production', (req, res) => { res.json(this.restFulData.production) });
            restFul.get('/productionct', (req, res) => { res.json(this.restFulData.productionCt) });
            restFul.get('/microinverters', (req, res) => { res.json(this.restFulData.microinverters) });
            restFul.get('/powermode', (req, res) => { res.json(this.restFulData.powerMode) });
            restFul.get('/plclevel', (req, res) => { res.json(this.restFulData.plcLevel) });
            restFul.get('/datasampling', (req, res) => { res.json(this.restFulData.dataSampling) });

            //post data
            restFul.post('/', (req, res) => {
                try {
                    const obj = req.body;
                    const emitDebug = this.restFulDebug ? this.emit('debug', `RESTFul post data: ${JSON.stringify(obj, null, 2)}`) : false;
                    const key = Object.keys(obj)[0];
                    const value = Object.values(obj)[0];
                    this.emit('set', key, value);
                    res.send('OK');
                } catch (error) {
                    this.emit('error', `RESTFul Parse object error: ${error}`);
                };
            });

            restFul.listen(this.restFulPort, () => {
                this.emit('connected', `RESTful started on port: ${this.restFulPort}`)
            });

        } catch (error) {
            this.emit('error', `RESTful Connect error: ${error}`)
        }
    };

    update(path, data) {
        switch (path) {
            case 'token':
                this.restFulData.token = data;
                break;
            case 'info':
                this.restFulData.info = data;
                break;
            case 'home':
                this.restFulData.home = data;
                break;
            case 'inventory':
                this.restFulData.inventory = data;
                break;
            case 'meters':
                this.restFulData.meters = data;
                break;
            case 'metersreading':
                this.restFulData.metersReading = data;
                break;
            case 'ensembleinventory':
                this.restFulData.ensembleInventory = data;
                break;
            case 'ensemblestatus':
                this.restFulData.ensembleStatus = data;
                break;
            case 'enchargesettings':
                this.restFulData.enchargesettings = data;
                break;
            case 'tariff':
                this.restFulData.tariff = data;
                break;
            case 'drycontacts':
                this.restFulData.drycontacts = data;
                break;
            case 'drycontactssettings':
                this.restFulData.drycontactssettings = data;
                break;
            case 'generator':
                this.restFulData.generator = data;
                break;
            case 'generatorsettings':
                this.restFulData.generatorsettings = data;
                break;
            case 'gridprofile':
                this.restFulData.gridProfile = data;
                break;
            case 'livedata':
                this.restFulData.liveData = data;
                break;
            case 'production':
                this.restFulData.production = data;
                break;
            case 'productionct':
                this.restFulData.productionCt = data;
                break;
            case 'microinverters':
                this.restFulData.microinverters = data;
                break;
            case 'powermode':
                this.restFulData.powerMode = data;
                break;
            case 'plclevel':
                this.restFulData.plcLevel = data;
                break;
            case 'datasampling':
                this.restFulData.dataSampling = data;
                break;
            default:
                this.emit('error', `RESTFul update path: ${path}, data: ${data}`)
                break;
        };
        const emitDebug = this.restFulDebug ? this.emit('debug', `RESTFul update path: ${path}, data: ${JSON.stringify(data, null, 2)}`) : false;
    };
};
export default RestFul;