"use strict";
const express = require('express');
const EventEmitter = require('events');
const server = express();

class RestFul extends EventEmitter {
    constructor(config) {
        super();
        this.restFulPort = config.port;
        
        this.restFulData = {
            info: 'This data is not available in your system.',
            home: 'This data is not available in your system.',
            inventory: 'This data is not available in your system.',
            meters: 'This data is not available in your system.',
            metersReading: 'This data is not available in your system.',
            ensembleInventory: 'This data is not available in your system.',
            ensembleStatus: 'This data is not available in your system.',
            profile: 'This data is not available in your system.',
            liveData: 'This data is not available in your system.',
            production: 'This data is not available in your system.',
            productionCt: 'This data is not available in your system.',
            microinverters: 'This data is not available in your system.',
            powerMode: 'This data is not available in your system.',
            plcLevel: 'This data is not available in your system.',
        };

        this.connect();
    };

    connect() {
        try {
            server.get('/info', (req, res) => { res.json(this.restFulData.info) });
            server.get('/home', (req, res) => { res.json(this.restFulData.home) });
            server.get('/inventory', (req, res) => { res.json(this.restFulData.inventory) });
            server.get('/meters', (req, res) => { res.json(this.restFulData.meters) });
            server.get('/metersreading', (req, res) => { res.json(this.restFulData.metersReading) });
            server.get('/ensembleinventory', (req, res) => { res.json(this.restFulData.ensembleInventory) });
            server.get('/ensemblestatus', (req, res) => { res.json(this.restFulData.ensembleStatus) });
            server.get('/profile', (req, res) => { res.json(this.restFulData.profile) });
            server.get('/livedata', (req, res) => { res.json(this.restFulData.liveData) });
            server.get('/production', (req, res) => { res.json(this.restFulData.production) });
            server.get('/productionct', (req, res) => { res.json(this.restFulData.productionCt) });
            server.get('/microinverters', (req, res) => { res.json(this.restFulData.microinverters) });
            server.get('/powermode', (req, res) => { res.json(this.restFulData.powerMode) });
            server.get('/plclevel', (req, res) => { res.json(this.restFulData.plcLevel) });

            server.listen(this.restFulPort, () => {
                this.emit('connected', `RESTful started on port: ${this.restFulPort}`)
            });

        } catch (error) {
            this.emit('error', `RESTful error: ${error}`)
        }
    };

    update(path, data) {
        switch (path) {
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
            case 'metersReading':
                this.restFulData.metersReading = data;
                break;
            case 'ensembleInventory':
                this.restFulData.ensembleInventory = data;
                break;
            case 'ensembleStatus':
                this.restFulData.ensembleStatus = data;
                break;
            case 'profile':
                this.restFulData.profile = data;
                break;
            case 'liveData':
                this.restFulData.liveData = data;
                break;
            case 'production':
                this.restFulData.production = data;
                break;
            case 'productionCt':
                this.restFulData.productionCt = data;
                break;
            case 'microinverters':
                this.restFulData.microinverters = data;
                break;
            case 'powerMode':
                this.restFulData.powerMode = data;
                break;
            case 'plcLevel':
                this.restFulData.plcLevel = data;
                break;
            default:
                break;
        };
    };
};
module.exports = RestFul;