"use strict";
const express = require('express');
const EventEmitter = require('events');

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
            gridProfile: 'This data is not available in your system.',
            liveData: 'This data is not available in your system.',
            production: 'This data is not available in your system.',
            productionCt: 'This data is not available in your system.',
            microinverters: 'This data is not available in your system.',
            powerMode: 'This data is not available in your system.',
            plcLevel: 'This data is not available in your system.'
        };

        this.connect();
    };

    connect() {
        try {
            const restFul = express();
            restFul.set('json spaces', 2);
            restFul.get('/token', (req, res) => { res.json(this.restFulData.token) });
            restFul.get('/info', (req, res) => { res.json(this.restFulData.info) });
            restFul.get('/home', (req, res) => { res.json(this.restFulData.home) });
            restFul.get('/inventory', (req, res) => { res.json(this.restFulData.inventory) });
            restFul.get('/meters', (req, res) => { res.json(this.restFulData.meters) });
            restFul.get('/metersreading', (req, res) => { res.json(this.restFulData.metersReading) });
            restFul.get('/ensembleinventory', (req, res) => { res.json(this.restFulData.ensembleInventory) });
            restFul.get('/ensemblestatus', (req, res) => { res.json(this.restFulData.ensembleStatus) });
            restFul.get('/gridprofile', (req, res) => { res.json(this.restFulData.gridProfile) });
            restFul.get('/livedata', (req, res) => { res.json(this.restFulData.liveData) });
            restFul.get('/production', (req, res) => { res.json(this.restFulData.production) });
            restFul.get('/productionct', (req, res) => { res.json(this.restFulData.productionCt) });
            restFul.get('/microinverters', (req, res) => { res.json(this.restFulData.microinverters) });
            restFul.get('/powermode', (req, res) => { res.json(this.restFulData.powerMode) });
            restFul.get('/plclevel', (req, res) => { res.json(this.restFulData.plcLevel) });

            restFul.listen(this.restFulPort, () => {
                this.emit('connected', `RESTful started on port: ${this.restFulPort}`)
            });

        } catch (error) {
            this.emit('error', `RESTful error: ${error}`)
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
            default:
                break;
        };
        const emitDebug = this.restFulDebug ? this.emit('debug', `RESTFul update path: ${path}, data: ${JSON.stringify(data, null, 2)}`) : false;
    };
};
module.exports = RestFul;